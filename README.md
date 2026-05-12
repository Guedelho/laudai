# laudai

Veterinary ultrasound report generator. Vets describe exam findings (by typing or voice), and the app produces a complete, structured report (laudo) in Portuguese using Google Gemini AI. Reports can be reviewed, edited, and exported as PDF.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 4**
- **Supabase** — auth, Postgres, storage
- **Google Gemini AI** — `gemini-3-flash-preview` (single-call report generation + transcription)
- **pdfmake** — server-side PDF generation (cached in storage)
- **Prettier** — code formatting with pre-commit hook

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key

## Local setup

1. **Clone and install**

   ```bash
   git clone <repo-url>
   cd laudai
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env.local
   # Fill in the four values — see .env.example for instructions
   ```

3. **Set up Supabase**
   - Open your project's SQL Editor and run the full contents of `supabase/schema.sql`
   - Go to **Storage** → create three private buckets: `report-images`, `report-pdfs`, and `profile-logos`
   - RLS policies are applied via migrations — all buckets scope access to `auth.uid() = first folder in path`

4. **Run the dev server**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

## Key routes

| Route          | Purpose                                                   |
| -------------- | --------------------------------------------------------- |
| `/new`         | Submit a new report (enqueues background generation)      |
| `/dashboard`   | Live list of reports — in-progress, completed, and failed |
| `/report/[id]` | View / edit / download a completed report                 |
| `/profile`     | Vet profile (name, CRMV)                                  |
| `/pets`        | Manage patients                                           |
| `/clinics`     | Manage clinics and responsible vets                       |

## How laudo generation works

Generation is asynchronous. The submit form `POST`s to `/api/generate`, which inserts a `reports` row with `status='pending'`, schedules the Gemini call via Next.js `after()`, and returns `{ reportId }` in <300ms. The user is redirected to `/dashboard` immediately and can start another laudo while the worker is running.

The dashboard subscribes to Supabase Realtime on the `reports` table (filtered by `user_id`) and shows in-progress rows with a spinner. When the worker flips `status` to `completed`, the dashboard fires an in-app toast and the row becomes clickable. Failed laudos show a "Tentar novamente" button that calls `/api/reports/[id]/regenerate`. A 15-minute Vercel cron (`/api/internal/sweep-stale-laudos`) sweeps any row stuck in `generating` for more than 10 minutes to `failed` — protects against crashes during the background callback.

## Deploying to Vercel

1. Push the repo to GitHub/GitLab
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Under **Project Settings → Environment Variables**, add all four variables from `.env.example`, plus a random `CRON_SECRET` (any long random string — used as a Bearer token on the cron route)
4. Deploy — `vercel.json` registers the stale-job cron; `serverExternalPackages: ["pdfmake"]` is already set in `next.config.ts`

## Project structure

```
app/
  (auth)/        # Route group — shared layout with auth check + AppHeader
    dashboard/   # Live reports list (Supabase Realtime + toast on completion)
    new/         # New report form (enqueues background generation, awaits image upload)
    report/[id]/ # View / edit / print report (renders "Gerando..." until status=completed)
    profile/     # Vet profile editor
    pets/        # Pet management
    clinics/     # Clinic management
  api/
    generate/                       # POST — enqueues laudo, returns { reportId }
    reports/[id]/                   # PATCH / DELETE on a report row
    reports/[id]/regenerate/        # POST — retry a failed laudo
    reports/[id]/images/            # POST/DELETE — exam images
    reports/[id]/pdf/               # GET — render or fetch cached PDF
    internal/sweep-stale-laudos/    # GET (cron, Bearer CRON_SECRET) — mark stuck rows failed
    pets/ clinics/ profile/         # CRUD for sidebar entities
  login/         # Public login page
components/
  AppHeader.tsx     # Navigation (auto-detects active route)
  ImageLightbox.tsx # Shared carousel lightbox with keyboard nav
  Typeahead.tsx     # Autocomplete input from existing values
  LoadingSkeleton.tsx
lib/
  services/      # Client-side typed fetch wrappers (pets, clinics, reports, profile)
  report/
    generate.ts  # Gemini single-call streaming generation + retry (server-only)
    worker.ts    # runGeneration — the background task: updates status, revalidates cache
    pdf.ts       # pdfmake PDF builder
    templates.ts # Prompts, defaults, specialty config
  supabase/
    admin.ts     # Service-role client
    client.ts    # Browser client
    server.ts    # Server-side client
    auth.ts      # getUserId, getProfile
    db.ts        # find-or-create helpers (clinics, vets, pets)
  api-handler.ts # withApiHandler: auth + CSRF + rate-limit + 500 wrapper
  rate-limit.ts  # Postgres-backed consumeRateLimit
  use-is-client.ts # useIsClient — hydration-safe client check (useSyncExternalStore)
  utils.ts       # Client-safe helpers (sexLabel, parseReportContent, splitBoldSegments, reportCacheTag)
  server-utils.ts # Server-only helpers (parseProfileImage, etc.)
shared/
  models.ts      # Core model interfaces (Report, Pet, Clinic, Profile…) + REPORT_STATUSES const
  interfaces.ts  # API request/response types (GenerateRequest, GenerateResponse, ApiResponse, …)
  constants.ts   # Dropdown options, AI model names, signed-URL TTLs
supabase/
  migrations/    # Incremental SQL migrations (status column + Realtime publication included)
vercel.json      # Stale-job cron registration (every 15 min)
```
