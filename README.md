# laudai

Veterinary ultrasound report generator. Vets describe exam findings (by typing or voice), and the app produces a complete, structured report (laudo) in Portuguese using Google Gemini AI. Reports can be reviewed, edited, and exported as PDF.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 4**
- **Supabase** — auth, Postgres, storage
- **Google Gemini AI** — `gemini-3.1-pro-preview` (report draft), `gemini-3-flash-preview` (verification + transcription)
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
   - Go to **Storage** → create three private buckets: `laudo-images`, `laudo-pdfs`, and `profile-logos`
   - RLS policies are applied via migrations — all buckets scope access to `auth.uid() = first folder in path`

4. **Run the dev server**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

## Key routes

| Route          | Purpose                             |
| -------------- | ----------------------------------- |
| `/new`         | Create a new laudo                  |
| `/dashboard`   | List recent laudos                  |
| `/laudai/[id]` | View / edit / download a laudo      |
| `/profile`     | Vet profile (name, CRMV)            |
| `/pets`        | Manage patients                     |
| `/clinics`     | Manage clinics and responsible vets |

## Deploying to Vercel

1. Push the repo to GitHub/GitLab
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Under **Project Settings → Environment Variables**, add all four variables from `.env.example`
4. Deploy — no `vercel.json` needed; `serverExternalPackages: ["pdfmake"]` is already set in `next.config.ts`

## Project structure

```
app/
  (auth)/        # Route group — shared layout with auth check + AppHeader
    dashboard/   # Recent laudos list
    new/         # New laudo form
    laudai/[id]/ # View / edit / print laudo (unified page)
    profile/     # Vet profile editor
    pets/        # Pet management
    clinics/     # Clinic management
  api/           # Route handlers (generate, transcribe, laudos, pets, clinics, profile)
  login/         # Public login page
components/
  AppHeader.tsx    # Navigation (auto-detects active route)
  ImageLightbox.tsx # Shared carousel lightbox with keyboard nav
  Typeahead.tsx    # Autocomplete input from existing values
  LoadingSkeleton.tsx
lib/
  gemini.ts      # Gemini API calls (streaming draft + verification + retry + scrubbers)
  templates.ts   # Specialty templates, defaults, nomenclature (from Mapa do Laudo Memorável)
  generatePdf.ts # pdfmake PDF builder
  parseLaudo.ts  # Parse Gemini JSON output
  rateLimit.ts   # Shared sliding-window rate limiter
  db.ts          # find-or-create helpers (clinics, vets, pets)
  supabase/
    client.ts    # Browser client + getAuthHeaders()
    admin.ts     # Service-role client for API routes
    server.ts    # Server-side client for pages
types/
  index.ts       # All shared types, dropdown options, API request/response, SSE events
supabase/
  migrations/    # Incremental SQL migrations
```
