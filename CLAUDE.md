@AGENTS.md

## Project context

**laudai** — veterinary ultrasound report generator. UI and all report content are in Portuguese (pt-BR). Users are veterinarians; the app generates structured reports (laudos) from short dictated findings.

## Naming convention

- **Internal code** (types, variables, functions, files, routes): use "report" (English).
- **UI copy** (labels, error messages, placeholders): use "laudo" (Portuguese).
- DB tables: `reports`, `report_images`. Storage buckets: `report-images`, `report-pdfs`.

## Stack

- **Next.js 16 App Router** — Tailwind 4 (PostCSS-based, no `tailwind.config.*`), Supabase SSR via `@supabase/ssr`
- **AI**: `lib/report/generate.ts` makes a single Gemini call per report (`gemini-3-flash-preview`) with a combined system prompt (sections + conclusion + verifier constraints). Streaming via `generateContentStream` with `responseMimeType: "application/json"` — chunks are concatenated server-side; the client never sees the stream. Retry with exponential backoff on transient errors (429/500/503/ECONNRESET). Generation uses `temperature: 0`. Trechos derivados dos achados do usuário são marcados pelo modelo com `**...**`; `splitBoldSegments` (em `lib/utils.ts`) converte esses marcadores em runs em negrito tanto no PDF quanto na visualização.
- **Async generation**: laudo generation runs as a background task. `POST /api/generate` validates input, inserts a `reports` row with `status='pending'`, schedules the Gemini call via Next.js `after()`, and returns `{ reportId }` immediately. `lib/report/worker.ts` (`runGeneration`) flips the row through `generating → completed | failed` and calls `revalidateTag(reportCacheTag(id), "max")` on completion. Status enum lives in `REPORT_STATUSES` (`shared/models.ts`) — write through it, never inline strings. The dashboard subscribes to Supabase Realtime postgres_changes on `reports` (UPDATE only, filter `user_id=eq.<id>`) **while at least one visible row is pending/generating** — the channel is torn down once all rows settle. A completion toast fires when a row flips into `completed`. Failed laudos retry via `POST /api/reports/[id]/regenerate` (uses the heavier `RATE_LIMITS.generate` bucket; only allowed when `status='failed'`). A 15-minute Vercel cron (`/api/internal/sweep-stale-laudos`, gated by `Bearer ${CRON_SECRET}`) marks rows stuck in `generating` for more than 10 minutes as `failed`.
- **Speech-to-text**: real-time via the browser Web Speech API (wrapped by `react-speech-recognition`). The mic button and live transcript live in `NewReportForm.tsx`. Firefox falls through to a disabled state with a tooltip; there is no server-side transcription endpoint.
- **PDF**: `lib/report/pdf.ts` (pdfmake). Fonts fetched from CDN and cached module-level. Generated PDFs are cached in the `report-pdfs` bucket — cleared on report edit or image changes.
- **Formatting**: Prettier with pre-commit hook via lint-staged. Run `npm run format` to format all files.
- **Database**: Supabase Postgres (project `rgemiayidnumeotplozm`, region `sa-east-1`). RLS on every table with `(select auth.uid()) = user_id` scoped to `authenticated` role. All FK and user_id columns are indexed.
- **Storage**: Three private buckets — `report-images` (exam images), `report-pdfs` (cached PDFs), `profile-logos` (logos + signatures). All have RLS policies scoping access to `auth.uid() = folder name`. All access via service role in API routes.
- **Auth**: Supabase Auth via cookies (SSR). `proxy.ts` (middleware) syncs session and redirects unauthenticated users to `/login`. API routes use `getUserId()` from `@/lib/supabase/auth` — cookie-only, no manual Bearer tokens.
- **Deployment**: Vercel. Git auto-deploy may be disconnected — use `vercel --prod` to deploy manually. Push via HTTPS as `guedelho`.

## Page structure

All authenticated pages live inside `app/(auth)/`. The route group layout handles auth check + `<AppHeader />` + outer wrapper.

1. **Auth**: Middleware (`proxy.ts`) redirects to `/login`. Layout (`app/(auth)/layout.tsx`) double-checks with `getUser()` inside an `<AuthGate>` Suspense boundary. Pages call `getUser()` only to get `user.id` for queries — return `null` if not authenticated (layout already redirected).
2. **Data**: Use `createAdmin()` for all server-side queries (never the anon client).
3. **No inline JSX**: Page files must be thin — fetch data, pass props to a client component.
4. **Loading**: Every page directory must have a `loading.tsx`.
5. **Errors**: `app/(auth)/error.tsx` catches page-level errors. `app/(auth)/report/[id]/not-found.tsx` for missing reports.
6. **Cache Components**: `cacheComponents: true` in `next.config.ts`. Cached server functions use `'use cache'` + `cacheTag` + `cacheLife` (see `app/(auth)/report/[id]/page.tsx`). Runtime data access (cookies, headers, `usePathname`) must live inside a `<Suspense>` boundary so the static shell can render.

## API route conventions

- Wrap every handler in `withApiHandler` (`@/lib/api-handler`). It handles: auth (`getUserId`), CSRF (Sec-Fetch-Site, on by default for non-GET), rate limiting (default **60/min per authenticated user**, Postgres-backed via the `rate_limit_consume` SQL function), and a generic 500 fallback. Override the default by passing a `RATE_LIMITS.<name>` from `shared/constants.ts` (e.g. `RATE_LIMITS.generate` for the 5/min Gemini bucket). Pass `{ publicAccess: true }` to skip auth + rate limit.
- Data: `createAdmin()` — never the anon client.
- FK ownership: when accepting `petId` / `clinicId` / `vetId` from a client body, run them through `resolveOwnedFks` (`@/lib/supabase/db`) before persisting — drops any id that doesn't belong to the caller.
- Image validation: Server-side via `sharp` magic-byte detection (not `file.type`).
- Errors: Log with `console.error`, return generic Portuguese message to client. Never leak internal details.
- Cache invalidation in route handlers: `revalidateTag(reportCacheTag(id), "max")` (stale-while-revalidate). Use the `reportCacheTag` helper from `@/lib/utils` — never hand-build the `report-${id}` string. `updateTag` is reserved for Server Actions and is not used here.
- Profile mutations call `invalidateUserPdfCache(admin, userId)` to clear cached PDFs (logo/signature/name/CRMV are baked into the PDF).
- Signed-URL TTLs are centralised in `SIGNED_URL_TTL` (`shared/constants.ts`): `display` (browsing), `serverFetch` (cached PDF re-fetch), `oneShot` (single-request asset hydration).

## Client-side conventions

- Auth is handled via cookies (`@supabase/ssr`) — no manual auth headers needed on fetch calls.
- API calls: use typed functions from `lib/services/` (pets, clinics, reports, profile, transcribe) — never inline `fetch()` in components.
- JSON requests: add `"Content-Type": "application/json"`. FormData requests need no extra headers (browser sets multipart boundary).

## Data model

- `status` — `pending | generating | completed | failed`. Set by `/api/generate` (`pending`), the worker (`generating` → terminal), `/api/reports/[id]/regenerate` (back to `pending`), or the stale-job sweeper (`failed`). Pre-existing rows from before the async migration default to `completed`.
- `generated_content` — immutable LLM output, populated by the background worker. `null` until `status='completed'`. Set once, never updated.
- `edited_content` — always the latest version. Starts equal to `generated_content` (set in the same worker write), updated on vet edits. All reads use `edited_content`. `null` until `status='completed'`.
- `error_message`, `generation_started_at`, `generation_completed_at` — populated by the worker. `error_message` is shown verbatim in the dashboard retry row.
- `raw_input` — original vet findings, immutable.
- Reports remain editable after generation via the "Editar" button; the PATCH route accepts updates with no immutability gate.
- Reports are historical documents. All patient, clinic, and vet data is stored as snapshot text on the report row — display always reads from these snapshot columns, never from joined tables. `reports` also has silent reference FK columns (`pet_id`, `clinic_id`, `vet_id`) that are stored at generation time and persisted on save, used exclusively to write updates back to the source entities (`pets`, `clinics`, `clinic_vets`) on each save — never for display. Imprimir saves the snapshot, writes back to source entities via the stored IDs, opens the PDF in a new tab, and switches back to view mode; the user can re-enter edit mode any time via "Editar".
- Profile fields `cpf`, `crmv`, `crmv_state` are immutable after first profile creation.
- All patient/report fields (`breed`, `age`, `sex`, `neutered`, `clinicName`, `responsibleVet`, `examDate`) are required — never nullable.
- Dropdown options (`SPECIES_OPTIONS`, `SEX_OPTIONS`, `sexLabel`) centralized in `shared/constants.ts`.

## Types

- Shared field sets: `PatientFields`, `ReportFields` in `shared/models.ts` — reuse via `extends` instead of repeating fields.
- API request bodies: `GenerateRequest`, `PetRequest`, `UpdateReportRequest`, `UpdateProfileRequest` — always type `req.json()`.
- API response bodies: `GenerateResponse` (`{ reportId? }`) and the other `*Response` types in `shared/interfaces.ts`. `ApiResponse` is the base error-bearing shape.
- Status: write via `REPORT_STATUSES.<x>` (the const object in `shared/models.ts`), read via the `ReportStatus` union.
- Required field validation: use a `required` array + loop, not repeated if/return blocks.

## Rules

- Do not add inline comments unless the logic is genuinely non-obvious.
- Do not create new files when editing an existing one suffices.
- Do not use `@react-pdf/renderer` — it has been removed from the project.
- No dead code, no engineering for the future. If it's not called, delete it.
