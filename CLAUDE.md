@AGENTS.md

## Project context

**laudai** — veterinary ultrasound report generator. UI and all report content are in Portuguese (pt-BR). Users are veterinarians; the app generates structured laudos from short dictated findings.

## Stack

- **Next.js 16 App Router** — Tailwind 4 (PostCSS-based, no `tailwind.config.*`), Supabase SSR via `@supabase/ssr`
- **AI**: `lib/gemini.ts` makes two Gemini calls per laudo — draft (`gemini-3.1-pro`) + verification (`gemini-3-flash`). Verification is skipped when input is empty. Model instances are cached module-level per `modelId::systemPrompt` key. Generation uses `temperature: 0` to minimize hallucinations.
- **Transcription**: `app/api/transcribe/route.ts` uses `gemini-3-flash` for audio → text.
- **PDF**: `lib/generatePdf.ts` (pdfmake). Fonts fetched from CDN and cached module-level.
- **Database**: Supabase Postgres (project `rgemiayidnumeotplozm`, region `sa-east-1`). RLS on every table with `(select auth.uid()) = user_id` scoped to `authenticated` role. All FK and user_id columns are indexed.
- **Storage**: Two private buckets — `laudo-images` (20 MB, jpeg/png/webp) and `profile-logos` (5 MB, jpeg/png/webp). Both have RLS policies scoping access to `auth.uid() = folder name`. All access via service role in API routes. Logo served through `GET /api/profile/logo` proxy (redirects to signed URL). Signature image served through `GET /api/profile/signature`.
- **Auth**: Supabase Auth via cookies (SSR). `proxy.ts` (middleware) syncs session. API routes use `getUserId()` from `@/lib/auth` which accepts both cookie session and `Authorization: Bearer <token>`.
- **Deployment**: Vercel. Git auto-deploy may be disconnected — use `vercel --prod` to deploy manually. Push via HTTPS as `guedelho`.

## Page structure (all pages must follow this pattern)

```
auth check → admin client → data fetch → <AppHeader /> → <ChildComponent />
```

1. **Auth**: `createClient()` → `getUser()` → `redirect("/login")` if not authenticated.
2. **Data**: Use `createAdmin()` for all server-side queries (never the anon client).
3. **Layout**: Return `<div className="min-h-screen bg-gray-50">` → `<AppHeader current="/path" />` → `<main>` → child component.
4. **No inline JSX**: Page files must be thin — auth, fetch, pass props to a child component. All rendering logic goes in the child component, never in page.tsx.
5. **Loading**: Every page directory must have a `loading.tsx` using `<LoadingSkeleton />`.

## API route conventions

- Auth: `getUserId()` from `@/lib/auth` — never from `@/lib/gemini`.
- Data: `createAdmin()` — never the anon client.
- Rate limiting: `checkRateLimit` + `recordRateLimit` from `@/lib/rateLimit` — never inline `Map<string, number[]>`.
- Image validation: Server-side via `sharp` magic-byte detection (not `file.type`).
- Errors: Log with `console.error`, return generic Portuguese message to client. Never leak internal details.
- Cache invalidation: `revalidateTag(\`laudo-${id}\`, "default")` — Next.js 16 requires the second argument.

## Client-side conventions

- Auth headers: `getAuthHeaders()` from `@/lib/supabase/client` — never inline `createClient().auth.getSession()`.
- JSON requests: add `"Content-Type": "application/json"` alongside `getAuthHeaders()`. FormData requests use `getAuthHeaders()` alone (browser sets multipart boundary).

## Types

- Shared field sets: `PatientFields`, `LaudoFields` in `types/index.ts` — reuse via `extends` instead of repeating fields.
- API request bodies: `GenerateRequest`, `PetRequest`, `UpdateLaudoRequest`, `UpdateProfileRequest` — always type `req.json()`.
- SSE events: `SseEvent` discriminated union — type all streaming event parsing.
- `sex` and `neutered` are required (`string` and `boolean`) everywhere — never nullable.

## Rules

- Do not add inline comments unless the logic is genuinely non-obvious.
- Do not create new files when editing an existing one suffices.
- Do not use `@react-pdf/renderer` — it has been removed from the project.
- No dead code, no engineering for the future. If it's not called, delete it.
