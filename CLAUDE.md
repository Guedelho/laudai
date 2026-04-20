@AGENTS.md

## Project context

**laudai** — veterinary ultrasound report generator. UI and all report content are in Portuguese (pt-BR). Users are veterinarians; the app generates structured reports (laudos) from short dictated findings.

## Naming convention

- **Internal code** (types, variables, functions, files, routes): use "report" (English).
- **UI copy** (labels, error messages, placeholders): use "laudo" (Portuguese).
- DB tables: `reports`, `report_images`. Storage buckets: `report-images`, `report-pdfs`.

## Stack

- **Next.js 16 App Router** — Tailwind 4 (PostCSS-based, no `tailwind.config.*`), Supabase SSR via `@supabase/ssr`
- **AI**: `lib/report/generate.ts` makes a single Gemini call per report (`gemini-3-flash-preview`) with a combined system prompt (sections + conclusion + verifier constraints). Streaming via `generateContentStream` with `responseMimeType: "application/json"`. Retry with exponential backoff on transient errors. Generation uses `temperature: 0`.
- **Transcription**: `app/api/transcribe/route.ts` uses `gemini-3-flash-preview` for audio → text.
- **PDF**: `lib/report/pdf.ts` (pdfmake). Fonts fetched from CDN and cached module-level. Generated PDFs are cached in the `report-pdfs` bucket — cleared on report edit or image changes.
- **Formatting**: Prettier with pre-commit hook via lint-staged. Run `npm run format` to format all files.
- **Database**: Supabase Postgres (project `rgemiayidnumeotplozm`, region `sa-east-1`). RLS on every table with `(select auth.uid()) = user_id` scoped to `authenticated` role. All FK and user_id columns are indexed.
- **Storage**: Three private buckets — `report-images` (exam images), `report-pdfs` (cached PDFs), `profile-logos` (logos + signatures). All have RLS policies scoping access to `auth.uid() = folder name`. All access via service role in API routes.
- **Auth**: Supabase Auth via cookies (SSR). `proxy.ts` (middleware) syncs session and redirects unauthenticated users to `/login`. API routes use `getUserId()` from `@/lib/supabase/auth` — cookie-only, no manual Bearer tokens.
- **Deployment**: Vercel. Git auto-deploy may be disconnected — use `vercel --prod` to deploy manually. Push via HTTPS as `guedelho`.

## Page structure

All authenticated pages live inside `app/(auth)/`. The route group layout handles auth check + `<AppHeader />` + outer wrapper.

1. **Auth**: Middleware (`proxy.ts`) redirects to `/login`. Layout (`app/(auth)/layout.tsx`) double-checks with `getUser()`. Pages call `getUser()` only to get `user.id` for queries — return `null` if not authenticated (layout already redirected).
2. **Data**: Use `createAdmin()` for all server-side queries (never the anon client).
3. **No inline JSX**: Page files must be thin — fetch data, pass props to a client component.
4. **Loading**: Every page directory must have a `loading.tsx`.
5. **Errors**: `app/(auth)/error.tsx` catches page-level errors. `app/(auth)/report/[id]/not-found.tsx` for missing reports.

## API route conventions

- Auth: `getUserId()` from `@/lib/supabase/auth`.
- Data: `createAdmin()` — never the anon client.
- Rate limiting: `checkRateLimit` + `recordRateLimit` from `@/lib/server-utils` — never inline `Map<string, number[]>`.
- Image validation: Server-side via `sharp` magic-byte detection (not `file.type`).
- Errors: Log with `console.error`, return generic Portuguese message to client. Never leak internal details.
- Cache invalidation: `revalidateTag(\`report-${id}\`, "default")` — Next.js 16 requires the second argument.

## Client-side conventions

- Auth is handled via cookies (`@supabase/ssr`) — no manual auth headers needed on fetch calls.
- API calls: use typed functions from `lib/api/` (pets, clinics, reports, profile, transcribe) — never inline `fetch()` in components.
- JSON requests: add `"Content-Type": "application/json"`. FormData requests need no extra headers (browser sets multipart boundary).

## Data model

- `generated_content` — immutable LLM output, set once on creation, never updated.
- `edited_content` — always the latest version. Starts equal to `generated_content`, updated on vet edits. All reads use `edited_content`.
- `raw_input` — original vet findings, immutable.
- `locked_at` — set on the first page load without `?review=1`. Once set, the report is permanently immutable; the PATCH route rejects requests with a 403.
- Reports are historical documents. All patient, clinic, and vet data is stored as snapshot text on the report row — display always reads from these snapshot columns, never from joined tables. `reports` also has silent reference FK columns (`pet_id`, `clinic_id`, `vet_id`) that are stored at generation time and persisted on save, used exclusively to write updates back to the source entities (`pets`, `clinics`, `clinic_vets`) during the review window — never for display. The review window (`?review=1`) is the one opportunity to edit; Imprimir saves the snapshot, writes back to source entities via the stored IDs, then locks the report.
- Profile fields `cpf`, `crmv`, `crmv_state` are immutable after first profile creation.
- All patient/report fields (`breed`, `age`, `sex`, `neutered`, `clinicName`, `responsibleVet`, `examDate`) are required — never nullable.
- Dropdown options (`SPECIES_OPTIONS`, `SEX_OPTIONS`, `sexLabel`) centralized in `shared/constants.ts`.

## Types

- Shared field sets: `PatientFields`, `ReportFields` in `shared/models.ts` — reuse via `extends` instead of repeating fields.
- API request bodies: `GenerateRequest`, `PetRequest`, `UpdateReportRequest`, `UpdateProfileRequest` — always type `req.json()`.
- SSE events: `SseEvent` discriminated union — type all streaming event parsing.
- Required field validation: use a `required` array + loop, not repeated if/return blocks.

## Rules

- Do not add inline comments unless the logic is genuinely non-obvious.
- Do not create new files when editing an existing one suffices.
- Do not use `@react-pdf/renderer` — it has been removed from the project.
- No dead code, no engineering for the future. If it's not called, delete it.
