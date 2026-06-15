# laudai

Veterinary ultrasound report generator. Vets describe exam findings (by typing or voice), and the app produces a complete, structured report (laudo) in Portuguese using Google Gemini AI. Reports can be reviewed, edited, exported as PDF, and shared across a team.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript**
- **Tailwind CSS 4**
- **Supabase** — auth, Postgres, storage
- **Google Gemini AI** — `gemini-3-flash-preview` (single-call report generation)
- **Stripe** — subscriptions (monthly/yearly), automatic 7-day trial at signup (no card), hosted Checkout + Customer Portal, webhook-driven entitlements
- **pdfmake** — server-side PDF generation (cached in storage)
- **Vercel BotID** — invisible bot protection on generation + upload routes
- **Google Tag Manager** — GA4 + Google Ads via `@next/third-parties`, production only (`NEXT_PUBLIC_GTM_ID` set only in Vercel's Production environment)
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

6. **Checks**: `npm run typecheck`, `npm run lint`, `npm run knip`, `npm run test` (Vitest — unit tests for the auth/validation logic).

## Key routes

| Route                            | Purpose                                                                                                                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/new`                           | Form-based report creation (direct field entry + voice dictation)                                                                                                                      |
| `/new/chat`                      | Assistente — unified chat (clinical Q&A, laudo lookup/discussion, conversational laudo generation) with paged history                                                                  |
| `/dashboard`                     | Live list of reports, in-progress and completed                                                                                                                                        |
| `/report/[id]`                   | View / edit / download a completed report                                                                                                                                              |
| `/profile`                       | Vet profile (name, CRMV, logo, signature) + plan & invoices (owner)                                                                                                                    |
| `/pets`                          | Manage patients                                                                                                                                                                        |
| `/clients`                       | Manage clients and responsible vets                                                                                                                                                    |
| `/legal/politica-de-privacidade` | Privacy policy (LGPD)                                                                                                                                                                  |
| `/legal/termos-de-uso`           | Terms of use                                                                                                                                                                           |
| `/login`                         | Public login page (email/password)                                                                                                                                                     |
| `/signup`                        | Public registration (email/password; requires CPF + CRMV)                                                                                                                              |
| `/onboarding`                    | Profile-completion fallback (CPF + CRMV) — authenticated, org-less                                                                                                                     |
| `/forgot-password`               | Public — request a password-reset email                                                                                                                                                |
| `/reset-password`                | Set a new password (reached via the recovery email link)                                                                                                                               |
| `/home`                          | Public marketing landing page (hero · especialistas · como funciona · recursos · segurança · preço · faq · contato · CTA) — proxy rewrites `laudai.vet/` here (app stays on subdomain) |

## Multi-tenancy

Every user belongs to at least one organization. Solo users get an org-of-1 automatically (individual plan, owner role) — the concept is invisible until they invite a teammate. A 7-day trial starts automatically at signup (no card required); entitlements are granted by the Stripe webhook.

- **Plans**: `individual`, `team` (seed rows; FK from `organizations.plan`)
- **Roles**: `owner`, `member` — one owner per org. Team management (member CRUD + invitations) is owner-only at the RLS level.
- **Scope**: reads are org-wide (team members see each other's data); mutations stay creator-only

## Report-type entitlements

Each report type (`report_types` catalog) is gated by two tables:

- `organization_report_types(org_id, report_type_id, expires_at)` — what the org owns. `expires_at` mirrors the Stripe subscription's current period end and is written by `/webhook/stripe`; the row is deleted when the subscription leaves entitled status (`trialing`/`active`).
- `member_specialties(org_id, user_id, report_type_id)` — which members can write which types. Owners are implicit (god-mode within the org's entitlements); other members need a grant.

`/api/generate` checks both. The 7-day trial starts automatically when the account is provisioned: `startTrialSubscription` creates a trialing Stripe subscription with no payment method, and the webhook grants the entitlement — no plan picker, no card. After the trial ends without a card, the subscription cancels, the entitlement drops, and the dashboard shows the subscribe gate (hosted Checkout, which converts straight to paid).

## How laudo generation works

Generation is asynchronous regardless of which creation flow is used:

**Form flow (`/new`)** — `POST /api/generate` inserts a `reports` row with `status='pending'`, schedules the Gemini call via Next.js `after()`, and returns `{ reportId }`. The user is redirected to `/dashboard` immediately and can start another laudo while the worker runs.

**Chat flow (`/new/chat`, "Assistente")** — A `ToolLoopAgent` (AI SDK) drives a conversational Gemini session at `POST /api/chat`. It works as a general veterinary assistant — the vet can ask clinical questions or for an opinion on an image, and the `listReports` / `getReport` tools let it answer about and discuss laudos already generated; it only starts the laudo-generation flow when the vet asks for a laudo. All chat entries share this single surface and every conversation is saved to the per-vet `chat_messages` timeline (text only; the route passes `generateMessageId` so assistant replies carry a server-assigned id and persist immediately — only not-yet-saved rows are inserted each turn). Each visit starts a fresh model context: the trailing burst of messages is resumed only when the last one is under an hour old, and everything older is display-only history loaded on demand via "Ver conversas anteriores" (`GET /api/chat/messages`, keyset-paginated with session dividers) — old messages are never re-sent to the model. The form's "Gerar por conversa" entry (`?laudo=1`) auto-sends the laudo request as the first message, and the report page's "Discutir" link (`?report=<id>`) auto-sends a discuss request so the agent pulls the laudo content via `getReport`. When generating a laudo, in the findings phase the agent asks the vet to attach the exam images in the chat and reads **organ names + measurements** from them — transcribing only legible values and never inventing; it asks the vet for any measurement it cannot read and for the abnormal findings (measurements come from the images, anomalies from the vet). It combines both into the findings text and calls the `createReportDraft` tool, which inserts the report row and fires `runGeneration` via `after()` — then returns `{ reportId }` to the UI. The chat-attached images are auto-persisted to the report (`AutoAttachImages`); a manual upload panel only appears as a fallback when no images were attached in chat. Generation runs in parallel, and the laudo renders as an embedded, fully editable widget in the chat via `ReportPreviewInChat` (subscribes to the org Realtime broadcast through the shared `useOrgReportsChannel` hook; shows immediately if already done, otherwise on the next broadcast). The vet edits every field — sections, impressão diagnóstica, recomendações, observações, conclusão, and patient data — directly in that widget; the chat agent does not mutate the laudo, it answers clinical questions and may offer a diagnostic opinion on an image when asked. The vet confirms with "Gerar PDF" when satisfied (no redirect required).

Both flows converge on the same creation helper (`createReport` in `lib/report/create.ts` — validation, entitlement checks, insert, generation kickoff), the same worker (`lib/report/worker.ts`), and the same `reports_broadcast` Postgres trigger that drives the dashboard's live list.

**Reliability layers:**

- The worker wraps the Gemini call in `Promise.race` with a 5-min timeout — failures surface within seconds.
- Stuck rows (worker died mid-flight) are flipped to `failed` by `sweepStuckReports` (`lib/report/sweep.ts`): org-scoped on every dashboard load (via `after()`) and globally by the daily `/api/internal/sweep-stuck-reports` cron.
- Generated PDFs are cached in storage with a 24h TTL; reads after that regenerate from the (possibly edited) report.
- Every report edit writes a snapshot to `report_versions` (append-only audit of laudo content).
- Every CRUD across pets, clients, reports, images, profile lands in `audit_log` (who did what when).

## LGPD compliance

- **Privacy policy + terms** at `/legal/*` (pt-BR)
- **Consent capture** in the `consents` table (terms + privacy_policy, versioned + IP) — recorded automatically at signup/onboarding, and re-acceptable via `POST /api/consents`
- **Account deletion is 30-day**: `DELETE /api/account` schedules deletion (sets `profiles.deletion_scheduled_at`). A daily cron at 03:00 UTC (`/api/internal/sweep-deleted-accounts`) hard-deletes storage + auth rows after the retention window. The profile page shows the scheduled purge date with a "Cancelar exclusão" button (`POST /api/account`) until then.
- **CPF / CRMV uniqueness** at the DB level — prevents account abuse.

## Deploying to Vercel

1. Push the repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Under **Project Settings → Environment Variables**, add the values from `.env.example`, plus a random `CRON_SECRET` (long random string used as a Bearer token on the cron routes)
4. Deploy — `vercel.json` registers the 30-day deletion sweep and stuck-report sweep crons; `serverExternalPackages: ["pdfmake"]` is already set in `next.config.ts`

Git auto-deploy is enabled per branch: pushes to `main` deploy to production (`app.laudai.vet`; `laudai.vet/` serves the landing page), and pushes to `staging` deploy to `laudai-staging.vercel.app` (separate Supabase project + Stripe test mode).

## Project structure

```
app/
  (auth)/                           # Auth-required route group
    dashboard/                      # Live reports list (Supabase Realtime)
    new/                            # Form-based report creation
      chat/                         # Assistente — general chat + laudo generation (ToolLoopAgent + in-chat preview)
    report/[id]/                    # View / edit / print report
    profile/                        # Profile editor + plan/invoices (owner) + privacy controls (delete)
    pets/ clients/                  # Pet & client management
  api/
    generate/                       # POST — enqueue laudo
    reports/[id]/                   # PATCH (writes version + updated_by) / DELETE
    reports/[id]/regenerate/        # POST — retry a failed laudo
    reports/[id]/images/            # POST/DELETE — exam images
    reports/[id]/pdf/               # GET — render or fetch cached PDF
    pets/ clients/ profile/         # CRUD for sidebar entities
    consents/                       # POST — record terms/privacy acceptance
    account/                        # DELETE (schedule) / POST (cancel)
    internal/sweep-deleted-accounts/ # Cron: 30-day account purge (daily 03:00 UTC)
    internal/sweep-stuck-reports/   # Cron: flip stuck pending/generating reports to failed (daily 03:30 UTC)
  legal/                            # Public privacy policy + terms
  login/ signup/ onboarding/        # Auth pages (login, registration, profile-setup fallback)
  forgot-password/ reset-password/  # Password reset flow
  auth/callback/                    # Email-confirmation + recovery handler
components/                         # AppSidebar, Typeahead (keyboard-accessible combobox), ImageLightbox, ...
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
vercel.json                         # Crons: sweep-deleted-accounts (03:00 UTC) + sweep-stuck-reports (03:30 UTC)
```
