# laudai

Veterinary ultrasound report generator. Vets describe exam findings (by typing or voice), and the app produces a complete, structured report (laudo) in Portuguese using Google Gemini AI. Reports can be reviewed, edited, exported as PDF, and shared across a team.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 4**
- **Supabase** — auth, Postgres, storage
- **Google Gemini AI** — `gemini-3-flash-preview` (single-call report generation)
- **Stripe** — subscriptions (monthly/yearly), hosted Checkout + Customer Portal, webhook-driven entitlements
- **pdfmake** — server-side PDF generation (cached in storage)
- **Vercel BotID** — invisible bot protection on generation + upload routes
- **Prettier** — code formatting with pre-commit hook

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key
- A [Stripe](https://stripe.com) account (test mode for local dev)

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
   # Fill in the values — see .env.example for instructions
   ```

3. **Set up Supabase**
   - Open your project's SQL Editor and run the full contents of `supabase/migrations/20260420000000_initial.sql`
   - Go to **Storage** → create three private buckets: `report-images`, `report-pdfs`, and `profile-logos`
   - All RLS, indexes, functions, triggers, and seed data (plans) are applied by the migrations

4. **Set up Stripe (test mode)**
   - Create a Product with two recurring prices (monthly + yearly); put their IDs in `STRIPE_PRICE_ID_MONTHLY` / `STRIPE_PRICE_ID_YEARLY`
   - In a second terminal, forward webhooks: `stripe listen --forward-to localhost:3000/webhook/stripe` — copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET`

5. **Run the dev server**
   ```bash
   npm run dev
   # Open http://localhost:3000
   ```

## Key routes

| Route                            | Purpose                                                                          |
| -------------------------------- | -------------------------------------------------------------------------------- |
| `/new`                           | Form-based report creation (direct field entry + voice dictation)                |
| `/new/chat`                      | Conversational agent — collects patient/client/exam data, previews laudo in-chat |
| `/dashboard`                     | Live list of reports, in-progress and completed                                  |
| `/report/[id]`                   | View / edit / download a completed report                                        |
| `/profile`                       | Vet profile (name, CRMV, logo, signature, account)                               |
| `/pets`                          | Manage patients                                                                  |
| `/clients`                       | Manage clients and responsible vets                                              |
| `/legal/politica-de-privacidade` | Privacy policy (LGPD)                                                            |
| `/legal/termos-de-uso`           | Terms of use                                                                     |
| `/login`                         | Public login page                                                                |
| `/signup`                        | Disabled (redirects to `/login`)                                                 |

## Multi-tenancy

Every user belongs to at least one organization. Solo users get an org-of-1 automatically (individual plan, owner role) — the concept is invisible until they invite a teammate. Entitlements are granted by Stripe webhook after the vet subscribes.

- **Plans**: `individual`, `team` (seed rows; FK from `organizations.plan`)
- **Roles**: `owner`, `member` — one owner per org. Team management (member CRUD + invitations) is owner-only at the RLS level.
- **Scope**: reads are org-wide (team members see each other's data); mutations stay creator-only

## Report-type entitlements

Each report type (`report_types` catalog) is gated by two tables:

- `organization_report_types(org_id, report_type_id, expires_at)` — what the org owns. `expires_at` mirrors the Stripe subscription's current period end and is written by `/api/webhooks/stripe`; the row is deleted when the subscription leaves entitled status (`trialing`/`active`).
- `member_specialties(org_id, user_id, report_type_id)` — which members can write which types. Owners are implicit (god-mode within the org's entitlements); other members need a grant.

`/api/generate` checks both. New signups have no entitlement until the Stripe Checkout flow completes (the 7-day trial is managed by Stripe, not the DB).

## How laudo generation works

Generation is asynchronous regardless of which creation flow is used:

**Form flow (`/new`)** — `POST /api/generate` inserts a `reports` row with `status='pending'`, schedules the Gemini call via Next.js `after()`, and returns `{ reportId }`. The user is redirected to `/dashboard` immediately and can start another laudo while the worker runs.

**Chat flow (`/new/chat`)** — A `ToolLoopAgent` (AI SDK) drives a conversational Gemini session at `POST /api/chat`. When all data is collected the agent calls the `createReportDraft` tool, which inserts the report row and fires `runGeneration` via `after()` — then returns `{ reportId }` to the UI. The image upload panel appears immediately; generation runs in parallel while the vet selects images. Once images are submitted, the laudo renders as an embedded, fully editable widget in the chat via `ReportPreviewInChat` (subscribes to the org Realtime broadcast through the shared `useOrgReportsChannel` hook; shows immediately if already done, otherwise on the next broadcast). The vet edits every field — sections, impressão diagnóstica, recomendações, observações, conclusão, and patient data — directly in that widget; the chat agent does not mutate the laudo, it only answers clinical questions. The vet confirms with "Gerar PDF" when satisfied (no redirect required).

Both flows converge on the same worker (`lib/report/worker.ts`) and the same `reports_broadcast` Postgres trigger that drives the dashboard's live list.

**Reliability layers:**

- The worker wraps the Gemini call in `Promise.race` with a 5-min timeout — failures surface within seconds.
- Generated PDFs are cached in storage with a 24h TTL; reads after that regenerate from the (possibly edited) report.
- Every report edit writes a snapshot to `report_versions` (append-only audit of laudo content).
- Every CRUD across pets, clients, reports, images, profile lands in `audit_log` (who did what when).

## LGPD compliance

- **Privacy policy + terms** at `/legal/*` (pt-BR)
- **Consent capture** in the `consents` table (terms + privacy_policy versioned)
- **Account deletion is 30-day**: `DELETE /api/account` schedules deletion (sets `profiles.deletion_scheduled_at`). A daily cron at 03:00 UTC (`/api/internal/sweep-deleted-accounts`) hard-deletes storage + auth rows after the retention window. Users can `POST /api/account` to cancel before then.
- **Data export**: `GET /api/account/export` returns a JSON document with all the user's data + signed URLs for images/PDFs.
- **CPF / CRMV uniqueness** at the DB level — prevents account abuse.

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Under **Project Settings → Environment Variables**, add the values from `.env.example`, plus a random `CRON_SECRET` (long random string used as a Bearer token on the cron routes)
4. Deploy — `vercel.json` registers the 30-day deletion sweep cron; `serverExternalPackages: ["pdfmake"]` is already set in `next.config.ts`

## Project structure

```
app/
  (auth)/                           # Auth-required route group
    dashboard/                      # Live reports list (Supabase Realtime)
    new/                            # Form-based report creation
      chat/                         # Conversational agent (ToolLoopAgent + in-chat preview)
    report/[id]/                    # View / edit / print report
    profile/                        # Profile editor + privacy controls (export, delete)
    pets/ clients/                  # Pet & client management
  api/
    generate/                       # POST — enqueue laudo
    reports/[id]/                   # PATCH (writes version + updated_by) / DELETE
    reports/[id]/regenerate/        # POST — retry a failed laudo
    reports/[id]/images/            # POST/DELETE — exam images
    reports/[id]/pdf/               # GET — render or fetch cached PDF
    pets/ clients/ profile/         # CRUD for sidebar entities
    consents/                       # POST — record terms/privacy acceptance
    account/                        # DELETE (schedule) / POST (cancel) / GET export
    internal/sweep-deleted-accounts/ # Cron: 30-day account purge (daily 03:00 UTC)
  legal/                            # Public privacy policy + terms
  login/ signup/                    # Auth pages (signup currently redirects)
components/                         # AppHeader, Typeahead, ImageLightbox, ...
lib/
  services/                         # Client-side typed fetch wrappers
  client/                           # Browser-only helpers (pdf-tab, audio-wav, dictation, use-is-client)
  hooks/                            # use-report-editor, use-directory, use-org-reports-channel
  report/
    generate.ts                     # Gemini single-call streaming + retry
    worker.ts                       # runGeneration — background task with 5min timeout
    pdf.ts                          # pdfmake builder
    templates.ts                    # Prompts, specialty config
    cache.ts                        # invalidateUser/OrgPdfCache
  supabase/
    admin.ts client.ts server.ts    # Three Supabase client variants
    auth.ts                         # getUserId, getServerUser, getCurrentOrgId
    profile.ts                      # getProfile
    entitlements.ts                 # hasReportTypeAccess, canWriteReport
    upserts.ts                      # find-or-create, resolveOwnedFks
    org.ts                          # isOrgOwner
  images.ts                         # parseProfileImage, serveProfileImage, detectImageFormat
  api-handler.ts                    # withApiHandler — provides orgId, admin, audit() to handlers
  audit.ts                          # logAudit + AUDIT_ACTIONS/AUDIT_ENTITIES
  log.ts                            # Structured logError
  utils.ts ui.ts                    # Helpers + shared Tailwind class strings
shared/
  models.ts                         # Domain types
  interfaces.ts                     # API request/response types
  constants.ts                      # TABLES, STORAGE_BUCKETS, LEGAL_VERSIONS, REPORT_TYPES, REPORT_STATUSES,
                                    # ORG_ROLES, SIGNED_URL_TTL, SUBSCRIPTION_REPORT_TYPES, SPECIES_OPTIONS, ...
supabase/
  migrations/                       # Single consolidated initial.sql (source of truth)
proxy.ts                            # Auth gate (Next.js 16 middleware)
instrumentation-client.ts           # BotID protected routes
vercel.json                         # Cron: sweep-deleted-accounts (daily 03:00 UTC)
```
