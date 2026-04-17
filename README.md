# laudai

Veterinary ultrasound report generator. Vets describe exam findings (by typing or voice), and the app produces a complete, structured report (laudo) in Portuguese using Google Gemini AI. Reports can be reviewed, edited, and exported as PDF.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 4**
- **Supabase** — auth, Postgres, storage
- **Google Gemini AI** — `gemini-3.1-pro` (report draft), `gemini-3-flash` (verification + transcription)
- **pdfmake** — server-side PDF generation

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
   - Go to **Storage** → create two private buckets: `laudo-images` and `profile-logos`
   - RLS policies are applied via migrations — both buckets scope access to `auth.uid() = first folder in path`

4. **Run the dev server**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

## Key routes

| Route | Purpose |
|-------|---------|
| `/new` | Create a new laudo |
| `/dashboard` | List recent laudos |
| `/laudai/[id]` | View / download a laudo |
| `/profile` | Vet profile (name, CRMV) |
| `/pets` | Manage patients |
| `/clinics` | Manage clinics and responsible vets |

## Deploying to Vercel

1. Push the repo to GitHub/GitLab
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Under **Project Settings → Environment Variables**, add all four variables from `.env.example`
4. Deploy — no `vercel.json` needed; `serverExternalPackages: ["pdfmake"]` is already set in `next.config.ts`

## Project structure

```
app/
  api/           # Route handlers (generate, transcribe, laudos, pets, clinics, profile)
  new/           # New laudo form + review panel
  laudai/[id]/   # View single laudo
  dashboard/     # Recent laudos list
  profile/       # Vet profile editor
  pets/          # Pet management
  clinics/       # Clinic management
lib/
  gemini.ts      # Gemini API calls (draft + verification agent)
  templates.ts   # Specialty templates, defaults, report titles
  generatePdf.ts # pdfmake PDF builder
  parseLaudo.ts  # Parse Gemini JSON output
  rateLimit.ts   # Shared sliding-window rate limiter
  db.ts          # find-or-create helpers (clinics, vets, pets)
  supabase/
    client.ts    # Browser client + getAuthHeaders()
    admin.ts     # Service-role client for API routes
    server.ts    # Server-side client for pages
types/
  index.ts       # All shared types (models, API request/response, SSE events)
supabase/
  migrations/    # Incremental SQL migrations
```
