@AGENTS.md

## Project context

**laudai** — veterinary ultrasound report generator. UI and all report content are in Portuguese (pt-BR). Users are veterinarians; the app generates structured laudos from short dictated findings.

## Stack notes

- **Next.js 16 App Router** — Tailwind 4 (PostCSS-based, no `tailwind.config.*`), Supabase SSR via `@supabase/ssr`
- **AI**: `lib/gemini.ts` makes two Gemini calls per laudo (draft + verification agent). Model is `gemini-3-flash-preview` with `apiVersion: "v1beta"`. Do not change model names without confirming availability.
- **PDF**: Only `lib/generatePdf.ts` (pdfmake) is active. `@react-pdf/renderer` has been removed.
- **Database**: Supabase Postgres with RLS on every table (`user_id = auth.uid()`). Always use the admin client (`SUPABASE_SERVICE_ROLE_KEY`) in API routes — never the anon client.
- **Auth**: Supabase Auth via cookies (SSR). `proxy.ts` (middleware) syncs session to request context. API routes accept both cookie session and `Authorization: Bearer <token>`.

## Rules

- Do not add inline comments unless the logic is genuinely non-obvious.
- Do not create new files when editing an existing one suffices.
- Do not use `@react-pdf/renderer` — it has been removed from the project.
- Error responses in API routes must not include internal error details (Supabase messages, Gemini messages). Log with `console.error` server-side and return a generic Portuguese message to the client.
- Image file validation (type + 20 MB size limit) is enforced server-side in `app/api/laudos/[id]/images/route.ts`. Client-side limit is 10 MB.
