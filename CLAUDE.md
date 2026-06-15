@AGENTS.md

## Project context

**laudai** — veterinary ultrasound report generator. UI and all report content are in Portuguese (pt-BR). Users are veterinarians; the app generates structured reports (laudos) from short dictated findings.

## Naming convention

- **Internal code** (types, variables, functions, files, routes): use "report" (English).
- **UI copy** (labels, error messages, placeholders): use "laudo" (Portuguese).
- **UI copy casing**: sentence case everywhere — headings, labels, buttons ("Novo laudo", "Achados do exame", "Médico responsável"). Never Title Case.

## Constants — never use string literals for these

All schema names, statuses, buckets, plan ids, audit actions, etc. live in const objects. Always import + use them.

- `TABLES.*` (e.g. `TABLES.reports`, `TABLES.audit_log`) — `shared/constants.ts`
- `STORAGE_BUCKETS.*` (`reportImages`, `reportPdfs`, `profileLogos`) — `shared/constants.ts`
- `REPORT_STATUSES.*` — `shared/constants.ts`
- `AUDIT_ACTIONS.*`, `AUDIT_ENTITIES.*` — `lib/audit.ts`
- `LEGAL_VERSIONS.*` (terms / privacy_policy version timestamps)
- `SIGNED_URL_TTL.*` (`display` / `serverFetch` / `oneShot`)

## Stack

- **Next.js 16 App Router** — Tailwind 4 (PostCSS-based, no `tailwind.config.*`), Supabase SSR via `@supabase/ssr`. `cacheComponents: true`. The app uses the **stock Tailwind type scale** with the **root `html` font-size set to 110%** in `globals.css` (≈17.6px base), a deliberate 10% proportional zoom of the whole UI (text + rem spacing). A previous 12px `@theme` downscale was reverted because it made the whole UI too small, so do any global scaling via the `html` font-size only — never via `@theme` token overrides. Never use arbitrary `text-[Npx]` values — pick a scale step. The UI font is Arial (set in `globals.css`; no webfont in the root layout). The four signature-preview script fonts load via `next/font/google` inside `ProfileForm.tsx` (self-hosted, no injected stylesheet); the PDF fetches its own fonts separately in `lib/report/pdf.ts`.
- **AI**: `lib/report/generate.ts` makes a single Gemini call per report (`gemini-3-flash-preview`) with a combined system prompt (sections + conclusion + verifier constraints). Streaming via `generateContentStream` with `responseMimeType: "application/json"` — chunks are concatenated server-side; the client never sees the stream. Retry with exponential backoff on transient errors (429/500/503/ECONNRESET) — and on Gemini's `content-filter`/`PROHIBITED_CONTENT` finish, which is a stochastic Google-side block that `safetySettings` cannot disable (the worker checks `finishReason` and treats a filtered finish as retryable so it never stores truncated JSON as a completed laudo). `temperature: 0`. All Gemini calls pass `GEMINI_SAFETY_SETTINGS` (`shared/constants.ts`, all categories `OFF`); the chat agent additionally wraps the model in a `wrapLanguageModel` middleware (`lib/agents/laudo-agent.ts`) that buffers each round-trip and re-rolls up to 5× on a filtered finish, below the tool loop so no tools re-run. The chat agent is also `temperature: 0` + fixed `seed`. Trechos derivados dos achados do usuário são marcados pelo modelo com `**...**`; `splitBoldSegments` (em `lib/utils.ts`) converte esses marcadores em runs em negrito tanto no PDF quanto na visualização.
- **Async generation**: Two creation paths share the same validation/insert/kickoff helper (`createReport` in `lib/report/create.ts`) and the same worker. (1) **Form** — `POST /api/generate` validates input, inserts a `reports` row with `status='pending'`, schedules the Gemini call via Next.js `after()`, returns `{ reportId }` immediately. (2) **Chat** — `POST /api/chat` runs a `ToolLoopAgent` (AI SDK, `lib/agents/laudo-agent.ts`) that acts as a general veterinary assistant (surfaced as "Assistente" in the sidebar): it converses freely (clinical Q&A, image opinions) and only runs the laudo-generation flow when the vet asks for a laudo. `listReports` + `getReport` tools (`lib/tools/laudo-tools.ts`) let it answer about / discuss laudos already generated. **Unified chat**: all chat entries are one surface at `/new/chat` → `/api/chat`, and every conversation persists to the per-vet `chat_messages` timeline (`lib/chat/history.ts`); only **text** parts are stored (image/tool parts are stripped, so reloaded history never re-triggers the laudo widgets). The route MUST pass `generateMessageId` to `createAgentUIStreamResponse` — without it the SDK leaves the response message id empty and `saveChatMessages` drops the assistant reply (`toTextOnly` skips id-less messages). `saveChatMessages` inserts only rows not yet in the table (one `id, user_id` lookup; `ignoreDuplicates` upsert) instead of rewriting the whole conversation each turn. Session semantics: the page mounts a **fresh model context** each visit — `loadRecentSession` resumes only the trailing burst when the last message is < 1h old (refresh mid-conversation doesn't wipe it); everything older is **display-only history**, paged via "Ver conversas anteriores" → `GET /api/chat/messages` (keyset on `seq`, `CHAT_HISTORY_PAGE_SIZE`, time-gap dividers in the UI) and never re-fed to the model. Entry modes (both skip resume and start a fresh session): `/new/chat?laudo=1` ("Gerar por conversa") auto-sends "Quero gerar um laudo de ultrassom abdominal."; `/new/chat?report=<id>` (the report page's "Discutir" link) auto-sends a discuss request with the report id so the agent fetches content via `getReport` (the old `ReportChatPanel` side panel + `/api/laudo-chat` were removed). The auto message is built server-side in `page.tsx` (`autoStartMessage` prop) — the vet never types the request; after auto-sending, the client strips the query param via shallow `history.replaceState` so a refresh resumes the conversation instead of restarting the flow. When generating a laudo it collects data conversationally. In the findings phase it asks the vet to attach the exam images in the chat and reads **organ names + measurements** from them (Gemini multimodal): it transcribes only clearly legible values and **never invents** — it explicitly tells the vet which measurements it could not read and asks for them, then asks the vet for the abnormal findings (sizes/names come from the images; anomalies always come from the vet). It combines both into `rawInput` and calls the `createReportDraft` tool (`lib/tools/laudo-tools.ts`), which inserts the row and fires `runGeneration` via `after()` (text-only generation — the agent has already transcribed the measurements). The chat-attached images are then auto-persisted to `report_images` by `AutoAttachImages`; the manual `ImageStep` panel is a fallback shown only when no images were attached in chat. `ReportPreviewInChat` (`app/(auth)/new/chat/ReportPreviewInChat.tsx`; the chat UI is split across `InteractiveLaudoChat.tsx`, `ChatMessage.tsx`, `ImageStep.tsx`, `ReportPreviewInChat.tsx`) subscribes to the org broadcast channel (via the shared `useOrgReportsChannel` hook) and renders the laudo as an editable widget once complete — no redirect to the report page. All edits (section text, lists, patient fields) happen directly in the embedded editor — the chat agent does not mutate the laudo; it answers clinical questions and may offer a diagnostic opinion on an image when asked (after clarifying questions), but that opinion never auto-fills the laudo. `lib/report/worker.ts` (`runGeneration`) flips the row through `generating → completed | failed` and calls `revalidateTag(reportCacheTag(id), "max")` on completion. The worker uses `Promise.race` with a 5-minute timeout — caught failures get reported back to the user fast. The dashboard subscribes to a Supabase Realtime **Broadcast** channel `org:<org_id>:reports` (private) and listens for the `report_changed` event. Events are emitted by the `reports_broadcast` Postgres trigger via `realtime.send()` — Broadcast is used instead of `postgres_changes` because the latter evaluates table RLS through `realtime.apply_rls`, where any recursive policy chain (e.g. `organization_members`) aborts the entire stream. Authorization on `realtime.messages` is gated by `is_org_member` (security definer) so teammates also receive updates; solo users are orgs-of-1. Failed laudos retry via `POST /api/reports/[id]/regenerate` (only allowed when `status='failed'`).
- **Speech-to-text**: real-time via browser Web Speech API (`react-speech-recognition`). Mic + transcript in `NewReportForm.tsx`. Firefox shows a disabled state with tooltip; no server-side transcription.
- **PDF**: `lib/report/pdf.ts` (pdfmake). Fonts fetched from CDN and cached module-level. Cached in `STORAGE_BUCKETS.reportPdfs` with a `pdf_cached_at` timestamp; reads treat the cache as a miss after `PDF_CACHE_TTL_MS` (24h) and regenerate. Cache is also invalidated on report edit, image changes, profile changes, and org-logo changes. PDFs use the **org's logo** (shared branding) plus the _original author's_ signature/CRMV/name. Print/download flow uses `openReportPdfTab` (`lib/client/pdf-tab.ts`): direct top-level navigation to the PDF route — the route opts out of BotID so the browser honors `Content-Disposition` and downloads use the right filename.
- **Branding split**: the **logo is org-level** (`organizations.logo_url`, shared by all members, owner-managed via `/api/org/logo`), the **signature is per-user** (`profiles.signature_image_url`, via `/api/profile/image/signature`). Both stored in `STORAGE_BUCKETS.profileLogos` — logos under `{orgId}/`, signatures under `{userId}/`. Served by `serveProfileImage` (`lib/images.ts`) which streams bytes through the API route rather than redirecting to a signed URL (browsers cache redirects, and the signed-URL target expires after `SIGNED_URL_TTL.serverFetch`s). Both routes opt out of BotID (`{ botId: false }`) because `<img src>` is browser-native without BotID headers. Org-logo changes call `invalidateOrgPdfCache(orgId)`; signature changes call `invalidateUserPdfCache(userId)` (both in `lib/report/cache.ts`). Org-logo write/delete is gated to owners via `isOrgOwner` (`lib/supabase/org.ts`).
- **Bot protection**: Vercel BotID is on by default for every `withApiHandler` route. Routes hit by browser-native mechanisms (`<img>`, `<a download>`, top-level navigation) opt out with `withApiHandler(..., { botId: false })` — currently `/api/org/logo`, `/api/profile/image/signature`, `/api/reports/[id]/pdf`. `instrumentation-client.ts` injects detection headers for all `/api/*` paths; `deepAnalysis` mode is enabled on `/api/generate` and `/api/reports/*/regenerate` (the Gemini-cost endpoints). **BotID's client challenge loads from a fixed same-origin namespace (`/149e9513-01fa-4fb0-aad4-566afd725d1b/…`, rewritten to `api.vercel.com` by `withBotId`); `proxy.ts`'s matcher excludes that prefix so the auth middleware never redirects an unauthenticated visitor's challenge to `/login` — otherwise the challenge never completes and the BotID-gated `POST /api/auth/signup-validate` hangs before `signUp` is reached (sign-in is unaffected because it calls Supabase directly, not a BotID route).**
- **Formatting**: Prettier + pre-commit hook via lint-staged. Run `npm run format` to format all files.
- **Tests**: Vitest (`npm run test`). Unit tests cover the pure auth/validation logic (`lib/cpf.test.ts`, `lib/crmv.test.ts`, `lib/account.test.ts`), chat history persistence (`lib/chat/history.test.ts`) and `splitBoldSegments` (`lib/utils.test.ts`) — colocated `*.test.ts`, run in the `node` environment. `vitest.config.ts` aliases `server-only` to its `empty.js` (plus `server.deps.inline`) so server-only modules are importable in tests.
- **Database**: Supabase Postgres (project `rgemiayidnumeotplozm`, region `sa-east-1`). Multi-tenant via `organizations`. Every domain table (`pets`, `clients`, `client_vets`, `reports`, `report_images`) has `org_id NOT NULL` + `user_id NOT NULL`. RLS: reads scope by org membership (team-visible); mutations stay user_id-self (only creator edits). All FK / `user_id` / `org_id` columns are indexed.
- **Storage**: Three private buckets — `STORAGE_BUCKETS.reportImages`, `STORAGE_BUCKETS.reportPdfs`, `STORAGE_BUCKETS.profileLogos` (created in the migration). `storage.objects` keeps RLS enabled with **no client policies**, so all access is service-role + signed URLs — the anon/authenticated client never touches storage directly.
- **Auth**: Supabase Auth via cookies (SSR). `proxy.ts` syncs session and redirects unauthenticated users to `/login` (except public paths). `withApiHandler` uses `getUserId()` from `@/lib/supabase/auth` — cookie-only, no Bearer tokens. `getServerUser`/`getCurrentOrgId` are wrapped in React `cache()` so the layout, page, and nested server components share one auth round-trip per request.
- **Signup**: `/signup` (`SignupForm.tsx`) registers via email+password (`supabase.auth.signUp`, email confirmation required — login already blocks unconfirmed users via the `email_not_confirmed` error). CPF + CRMV state + number are required and unique (`profiles_cpf_unique`, `profiles_crmv_unique`); validated server-side (`/api/auth/signup-validate` pre-checks, but the DB constraints are the source of truth). After confirmation the user lands on `/auth/callback` (`exchangeCodeForSession`/`verifyOtp`, sanitized `next`), which creates the profile + solo org atomically via the `provision_account()` SQL function (service-role only) from the `signUp` metadata. After provisioning, `startTrialSubscription` auto-starts the 7-day Stripe trial (no card). `lib/supabase/provisioning.ts` maps unique violations to friendly field errors. Both provisioning paths (callback + `/api/onboarding`) also record terms + privacy consent (`recordSignupConsents`, LGPD) with the client IP (`clientIp` in `lib/api-handler.ts`). `/onboarding` is a fallback that collects CPF/CRMV for any authed user who reaches the app without a profile (callback provision failed, or a user created directly in Supabase) — the `(auth)` layout gate redirects profile-less users there. Password reset: `/forgot-password` (`resetPasswordForEmail`) → recovery email → `/auth/callback` → `/reset-password` (`updateUser`). The "confirme seu email" panel can resend the confirmation (`supabase.auth.resend`) behind a 60s client cooldown (matches Supabase's resend rate limit). CPF/CRMV are stored canonical (digits-only / uppercased, no spaces) — see `lib/cpf.ts`, `lib/crmv.ts`. (Google OAuth was intentionally left out for now — no provider configured.) Dashboard prerequisites (Supabase: enable Confirm email + redirect URLs + leaked-password protection) are configured per-project, not in code. **The confirm-signup and reset-password email templates must link to `/auth/callback` with `token_hash` + `type`** (not the default `{{ .ConfirmationURL }}`, which breaks cross-device) so the callback's `verifyOtp` works — e.g. `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup` and `...&type=recovery&next=/reset-password`.
- **Deployment**: Vercel. Git auto-deploy is enabled — pushes to `main` (production) and `staging` deploy automatically. Personal repo (`Guedelho/laudai`); push as the `Guedelho` gh account.

## Multi-tenancy

Every user belongs to ≥1 organization. Solo users get an org-of-1 (individual plan, they are the owner) — invisible plumbing. The concept only surfaces in UI when they invite a teammate or upgrade.

- `organizations` — id, name, slug, plan (FK to `plans`), owner_user_id (FK to `auth.users` with `on delete cascade` so the LGPD sweep can hard-delete the user without manual cleanup), deleted_at
- `organization_members` — (org_id, user_id) PK, role ∈ {`owner`, `member`}. Partial unique index ensures one owner per org. Team management (member CRUD + invitations) is owner-only at the RLS level.
- `organization_invitations` — pending invitations with token + expires_at; partial unique on (org_id, email) where not accepted. No role column — invitees join as `member` and the owner grants specialties separately.
- `plans` — catalog table seeded with `individual`, `team`. ID-only; display labels live in code. `organizations.plan` references it (FK, on update cascade).

Helpers:

- `getCurrentOrgId(userId)` in `lib/supabase/auth.ts` — returns the user's primary org (owned first, then any membership). Until the org switcher is built, this is the "current" org for every request.
- `provision_account(userId, full_name, cpf, crmv, crmv_state, slug)` — SQL function (service-role only; `EXECUTE` revoked from `public`/anon/authenticated). Atomically inserts the profile + org + owner membership; a cpf/crmv unique violation aborts it whole (no orphan org). This is what signup/onboarding call. No entitlement is granted by the function itself — `startTrialSubscription` runs right after provisioning to auto-start the 7-day trial, and the Stripe webhook mirrors it.

Plan enforcement (member counts, features) is **application-level** — no quotas in DB.

## Report-type entitlements

Two layers gate `/api/generate`:

- **Billing** (`organization_report_types(org_id, report_type_id, expires_at)`) — what the org owns. `expires_at` always reflects the Stripe subscription's current period end (trial end during `trialing`, next renewal during `active`). `hasReportTypeAccess()` in `lib/supabase/entitlements.ts` rejects when `now() >= expires_at`. The Stripe webhook (`/webhook/stripe`) upserts these rows on `customer.subscription.*` and `invoice.*` events, granting/revoking the types in `SUBSCRIPTION_REPORT_TYPES` (`shared/constants.ts` — the single source of truth for "what a subscription grants"); rows are deleted when the subscription leaves entitled status.
- **Permission** (`member_specialties(org_id, user_id, report_type_id)`) — which members can write which types. `canWriteReport()` (`lib/supabase/entitlements.ts`) short-circuits true for org owners (god-mode within the org's entitlements); otherwise it requires a grant row. Composite FK back to `organization_members(org_id, user_id)` so grants can only target actual members.

The catalog `report_types(id)` is the FK target for both `reports.specialty` and the two gate tables (ID-only; display labels live in `SPECIALTIES` in `lib/report/templates.ts`). Today only `ultrasound_abdominal` has prompts/templates wired in `lib/report/generate.ts`; the `periodontal_treatment` catalog row exists but is not yet generatable end-to-end — keep that in mind before granting it.

## Stripe billing

Stripe is the source of truth for subscriptions. `organizations` has `stripe_customer_id`, `stripe_subscription_id`, `stripe_subscription_status` (mirrored verbatim from Stripe). All customer / subscription / entitlement logic is centralized in `lib/stripe/subscription.ts` (`ensureStripeCustomer`, `startTrialSubscription`, `syncSubscription`, `getBillingOverview`), shared by the webhook, checkout, signup, and profile.

- **Auto-trial at signup** — `startTrialSubscription` runs right after provisioning (from `/auth/callback` and `/api/onboarding`) and creates a `trialing` subscription on the monthly price with **no payment method** (`trial_settings.end_behavior.missing_payment_method: "cancel"`), then mirrors it via `syncSubscription` so the org is entitled immediately. No plan picker, no card. Best-effort: a Stripe failure is logged and never blocks account creation. At trial end with no card, Stripe cancels and the org falls back to `<SubscribeGate />`.

- **Checkout** — `POST /api/billing/checkout` ensures the Stripe Customer (`ensureStripeCustomer`) and returns a Checkout Session URL in `mode: "subscription"` — **no trial** (the trial already ran at signup; this is the convert-to-paid path). Body `{ plan: "monthly" | "yearly" }` selects the price (defaults to monthly); the price IDs live server-side in `PLAN_PRICE_IDS` (`lib/stripe/server.ts`) — the client only sends the plan name, never a `price_...`. `<SubscribeGate />` (two-button picker) redirects the browser to the returned URL.
- **Customer Portal** — `POST /api/billing/portal` returns a hosted portal URL (cancel, update card, invoices). **Owner-gated** (`isOrgOwner`); members can't manage billing. The header subscription chip is likewise shown only to owners.
- **Webhook** — `POST /webhook/stripe` (outside `/api/*` so Vercel BotID doesn't challenge Stripe's server-to-server callbacks; `proxy.ts` lists `/webhook/` in `PUBLIC_PREFIXES`). Verifies the signature with `STRIPE_WEBHOOK_SECRET` and handles `customer.subscription.{created,updated,deleted,trial_will_end}` + `invoice.{paid,payment_failed}`. The handler delegates to `syncSubscription` (`lib/stripe/subscription.ts`) — the same writer the signup trial uses — which upserts `organization_report_types.expires_at` to the subscription's current period end (`subscriptionPeriodEnd()` — the dahlia API moved this from Subscription to SubscriptionItem) and deletes the row when status leaves the entitled set. SDK API version pinned in `lib/stripe/server.ts` (`2026-04-22.dahlia`).
- **Entitled statuses** — `ENTITLED_SUBSCRIPTION_STATUSES` (`shared/constants.ts`) = `{trialing, active, past_due}` is the single source of truth read by the webhook AND both UI gates. `past_due` stays entitled so a failed card keeps access during Stripe dunning. Never redefine this set locally — they must not drift.
- **Gates** — `app/(auth)/dashboard/page.tsx` shows `<SubscribeGate />` when status isn't entitled; otherwise the report list (new signups are `trialing` from the start, so they skip the gate). The status chip (trial countdown / "Gerenciar assinatura") lives in the **left sidebar** via `app/(auth)/layout.tsx` → `<SubscriptionChip />`. The profile shows owner-only **Plan + Invoices** cards (`app/(auth)/profile/BillingSection.tsx`, fed by `getBillingOverview`), with "Gerenciar" opening the portal.
- **Prices** — monthly `STRIPE_PRICE_ID_MONTHLY` (R$ 99,90) + yearly `STRIPE_PRICE_ID_YEARLY` (R$ 990,90). Per-seat/team add-on prices exist in Stripe but aren't wired into Checkout yet (later PR).

For local dev, `stripe listen --forward-to localhost:3000/webhook/stripe` prints a `whsec_...` to put in `.env.local`; that key is per-session and changes each invocation.

**Vercel preview deployment protection gotcha:** when forwarding a webhook to a Vercel deployment gated by SSO, append `?x-vercel-protection-bypass=<secret>` to the URL — but NOT `&x-vercel-set-bypass-cookie=true`. The set-bypass-cookie flow makes Vercel rewrite the response/body, which breaks Stripe's signature verification (the signed raw body no longer matches). Bypass token alone is fine.

## Domains & environments

- **Production** — app at `app.laudai.vet`. On the root domain (`laudai.vet`/`www.laudai.vet`), proxy.ts rewrites `/` to the public marketing landing page (`app/home/page.tsx` — a self-contained static Server Component: hero, "criado por especialistas", como funciona, recursos, segurança, preço, FAQ (details/summary + FAQPage JSON-LD), contato/WhatsApp, CTA, footer — positioning leads with specialist credibility + speed + security, AI is deliberately de-emphasized; marketing copy never uses dashes; auth/legal CTAs are built from `NEXT_PUBLIC_APP_URL` so they resolve same-origin on staging/local and to `app.laudai.vet` in production — never hardcode the app origin here); every other root-domain path 307-redirects to `app.laudai.vet` so the Supabase auth cookie stays anchored to one host. Supabase project `rgemiayidnumeotplozm`. Stripe is in **live mode**. **Analytics**: Google Tag Manager (GA4 + Google Ads) loads in the root layout via `@next/third-parties` only when `NEXT_PUBLIC_GTM_ID` is set — the var exists solely in Vercel's Production environment, so staging/local builds ship zero tracking; never hardcode the GTM id in code. **Brand assets**: `app/icon.svg` + `app/icon.png` + `app/apple-icon.png` + `app/favicon.ico` (favicons, auto-linked by Next via the file convention); logo lockups live in `public/` — `logo.svg` (horizontal, light bg), `logo-negative.svg` (white wordmark, dark bg), `logo-mark.svg` (square mark), `logo-mark-negative.svg` (white tile / gradient glyph). The mark is a gradient (`#2563eb`→`#7c3aed`) squircle with a white "L" + AI sparkle. `logo.svg` is the brand everywhere the name appears as chrome — landing header/footer, app sidebar (desktop + mobile + drawer), login card, legal header — rendered as `<img>` at `h-9` in chrome (sidebar, legal header, landing header — `sm:h-10`), `h-8` in the landing footer, and `h-11` on the login card (SVG gains nothing from `next/image`; the lint warning is accepted). Never render the brand as plain text.
- **Staging** — branch `staging`, auto-deploys to `laudai-staging.vercel.app` on push (git auto-deploy is enabled for the branch). Separate Supabase project `jrspzfygwkjercxdqyqx` and Stripe **test mode**. All staging env vars are scoped to the `staging` git branch in Vercel's Preview environment.
- **Env var naming** — Supabase keys use the modern format: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (was `ANON_KEY`) and `SUPABASE_SECRET_KEY` (was `SERVICE_ROLE_KEY`). The values are `sb_publishable_…` / `sb_secret_…`.

## Audit log

`audit_log` is the polymorphic append-only record of every create/update/delete on domain entities (`pet`, `client`, `client_vet`, `report`, `report_image`, `profile`, `organization`, `organization_member`, `organization_report_type`, `member_specialty`). Every mutation endpoint writes one via the `audit()` helper that `withApiHandler` provides in ctx (auto-bound to the request's userId + orgId).

```ts
await audit({ action: AUDIT_ACTIONS.delete, entityType: AUDIT_ENTITIES.pet, entityId: id, changes: before });
```

RLS: org members read; insert is gated to `user_id = auth.uid()` (no impersonation). No UPDATE/DELETE policies — entries are immutable for authenticated users.

**Ops visibility:** `internal.user_activity` (view in the `internal` schema — NOT exposed via the API) is a unified per-user timeline merging `audit_log` actions + `chat_messages` conversations. Query it from Supabase Studio / service role only (`select * from internal.user_activity where user_id = '…' order by ts`). Never expose `internal` to client roles.

## Report version history

`report_versions` is append-only. PATCH `/api/reports/[id]` looks up the current max version, inserts a snapshot of the new `edited_content` as `version + 1`, then updates `reports.edited_content` + `updated_by` in place. The "latest" view is always `reports.edited_content` — `report_versions` is only read on "Ver histórico" / compliance export. Versioning started May 2026; earlier edits were not reconstructed.

## 30-day deletion (LGPD)

`DELETE /api/account` does **not** immediately purge. It sets `profiles.deletion_scheduled_at = now()` and returns 202. The user can still log in and `POST /api/account` to cancel (clears the timestamp). Daily at 03:00 UTC, `/api/internal/sweep-deleted-accounts` finds rows past `now() - 30 days` and hard-deletes: storage objects in all three buckets + `admin.auth.admin.deleteUser` (which cascades DB rows via FKs). The UI lives in `app/(auth)/profile/AccountActions.tsx`: confirming stays on the profile (router.refresh, no logout) and the page then shows a scheduled-deletion banner with the purge date and a "Cancelar exclusão" button wired to `POST /api/account` (`cancelAccountDeletion` in `lib/services/profile.ts`). The confirm copy must state the 30-day grace, never "irreversível".

## Page structure

All authenticated pages live inside `app/(auth)/`. The route group layout handles auth check + profile gate (no profile → `/onboarding`) + `<AppSidebar />` (left sidebar) + outer wrapper. Public pages: `/home` (root-domain landing — proxy rewrites `laudai.vet/` here), `/login`, `/signup`, `/forgot-password`, `/auth/callback` (email-confirmation + recovery handler), `/legal/*` (politica-de-privacidade, termos-de-uso). `/onboarding` (profile completion) and `/reset-password` (recovery session) are authenticated but org-less, so they sit outside `app/(auth)/`.

1. **Auth**: `proxy.ts` redirects unauthenticated users to `/login`. Layout (`app/(auth)/layout.tsx`) double-checks with `getUser()` inside an `<AuthGate>` Suspense boundary. Pages call `getUser()` only to get `user.id` for queries — return `null` if not authenticated.
2. **Data**: Use `createAdmin()` for all server-side queries (never the anon client). Scope reads by `org_id` via `getCurrentOrgId(user.id)`.
3. **No inline JSX**: Page files are thin — fetch data, pass props to a client component.
4. **Loading**: Every page directory has a `loading.tsx`.
5. **Errors**: `app/(auth)/error.tsx` catches page-level errors. `app/(auth)/report/[id]/not-found.tsx` for missing reports.
6. **Cache Components**: Cached server functions use `'use cache'` + `cacheTag` + `cacheLife` (see `app/(auth)/report/[id]/page.tsx`). Runtime data access (cookies, headers, `usePathname`) must live inside a `<Suspense>` boundary so the static shell can render.

## API route conventions

Wrap every handler in `withApiHandler` (`@/lib/api-handler`). Signature: `withApiHandler(handler, opts?)` where `opts` is `{ botId?: boolean }` — defaults to BotID on. The context provided to handlers:

- `userId` — authenticated user's id
- `orgId` — user's primary org (via `getCurrentOrgId`)
- `admin` — service-role Supabase client (one per request)
- `audit({ action, entityType, entityId, changes? })` — pre-bound to userId + orgId
- `req`, `params` (params is already resolved — Next.js 16 Promise is awaited inside the wrapper)

`withApiHandler` runs: BotID check (unless `{ botId: false }`) → auth → org lookup → 500 fallback. Two sibling wrappers share the same BotID + error-handling shell for requests that can't have an org yet (all in `@/lib/api-handler`): `withAuthHandler` (auth only, ctx = `userId`/`admin`/`req`/`params`, no org/audit — used by `/api/onboarding`, which creates the org) and `withPublicHandler` (no auth, ctx = `admin`/`req`/`params` — used by `/api/auth/signup-validate`). Cron routes don't use any wrapper — they're plain `GET` exports gated by `Bearer ${CRON_SECRET}`.

CSRF protection is handled by Supabase's `SameSite=Lax` cookies plus modern browser defaults — no custom check. Rate limiting is per-user (keyed by `user_id`, not IP) via the `rate_limits` table and the `check_rate_limit` Postgres function. Opt in by passing `{ rateLimit: { endpoint, max, windowSec } }` to `withApiHandler`. Active on `/api/generate` (10/min), `/api/reports/[id]/regenerate` (10/min), `/api/reports/[id]/pdf` (30/min), `/api/chat` (30/min). Fails open if the RPC errors. Stale window rows are swept hourly by pg_cron via `cleanup_rate_limits()`.

**Chat token budget:** `/api/chat` also enforces a per-user, per-day Gemini cost ceiling (separate from the rate limit). `chat_token_usage(user_id, usage_date, input_tokens, output_tokens)` accumulates real usage; the `add_chat_token_usage` RPC upserts-and-returns like `check_rate_limit`. Enforcement is check-before/record-after: the route calls `isChatBudgetExceeded` (`lib/chat/usage.ts`) before streaming and returns 429 `CHAT_BUDGET_EXCEEDED_MESSAGE` when today's cost ≥ `CHAT_DAILY_BUDGET_NANO_USD` ($0.20/day ≈ R$1, single value for all users for now); the agent's `onFinish` records `totalUsage` (aggregated across all tool-loop steps) via `recordChatUsage` wrapped in `after()`. Cost is weighted ($0.50/1M input, $3.00/1M output → `GEMINI_*_PRICE_NANO_USD_PER_TOKEN`), `usage_date` is the `brazilToday()` (America/Sao_Paulo) day, both helpers fail open/best-effort. The chat UI keys off `CHAT_BUDGET_EXCEEDED_MESSAGE` to show an amber "limite atingido" bubble (no retry) instead of the red transient-error bubble. The table just accumulates (one row per user per day); no retention sweep yet. The form path (`/api/generate`) is not metered. To split budgets by plan later, add `budgetForUser(status)` reading `stripe_subscription_status`.

**Scope rules:**

- Reads: filter by `org_id` (team-visible). Use `.eq("org_id", orgId)`.
- Mutations (UPDATE/DELETE): filter by `user_id` (only the row's author can mutate). Use `.eq("user_id", userId)`.
- Inserts: always set both `user_id: userId` and `org_id: orgId`.
- FK ownership: `resolveOwnedFks(admin, orgId, ids)` filters incoming petId/clientId/vetId to those in the caller's org.

**Other:**

- Image validation: server-side via `sharp` magic-byte detection (not `file.type`).
- Errors: `logError("...", err, { userId, ... })` from `@/lib/log` (structured JSON to stdout — Vercel parses). Return generic Portuguese message to the client.
- Cache invalidation: `revalidateTag(reportCacheTag(id), "max")` — never hand-build `report-${id}` strings.
- Profile mutations call `invalidateUserPdfCache(admin, userId)` (signature/name/CRMV are baked into the PDF per author); org-logo mutations call `invalidateOrgPdfCache(admin, orgId)` since the logo is shared org-wide.

## Client-side conventions

- Auth via cookies (`@supabase/ssr`) — no manual auth headers on fetch calls.
- API calls: typed functions in `lib/services/` (pets, clients, reports, profile) — never inline `fetch()` in components.
- JSON requests: add `"Content-Type": "application/json"`. FormData requests need no extra headers.
- Buttons: use the shared classes in `lib/ui.ts` (`btnPrimary`, `btnSecondary`, `btnDanger`, `btnBlock`, `btnAssistant` for assistant entry points, `btnIcon` for bordered icon buttons) — they carry the keyboard `focus-visible` ring. Don't hand-roll `bg-blue-600 …` button classes.
- Entity manager pages (pets, clients) share the `useEntityCrud` hook (`lib/hooks/use-entity-crud.ts`) for list + add/edit/delete state; bespoke flows (e.g. client vets) use its `setItems` escape hatch.
- Image selection UIs use the shared `<ImagePicker />` (`components/ImagePicker.tsx`) — selection, size/count validation, previews, and lightbox in one place; submit semantics stay at the call site. The brand sparkle is `<SparkleIcon />` (`components/icons.tsx`) — don't paste the SVG path. Always set `type="button"` on non-submit buttons inside/near a form.
- `Typeahead`/`EntityTypeahead` (`components/`) implement the ARIA combobox keyboard pattern (Arrow up/down, Enter to select, Escape to close; `role="listbox"`/`option` + `aria-activedescendant`). All keyboard logic lives in `Typeahead`; `EntityTypeahead` only adds label↔entity resolution.
- Don't swallow async failures in components. Surface them to the user (inline error or warning) — e.g. `NewReportForm` shows a warning + link to the report when post-create image upload fails instead of redirecting silently.

## Data model

- `status` ∈ `REPORT_STATUSES.{pending, generating, completed, failed}`. Set by `/api/generate` (`pending`), the worker (`generating` → terminal), or regenerate (back to `pending`). Pre-async-migration rows default to `completed`. The worker's 5-minute `Promise.race` timeout catches Gemini hangs. Stuck rows (worker died mid-flight) are swept by `sweepStuckReports` (`lib/report/sweep.ts`): `pending`/`generating` older than 10 min flip to `failed` — runs org-scoped via `after()` on every dashboard load and globally via the daily `/api/internal/sweep-stuck-reports` cron (03:30 UTC, `bearerOk` from `lib/cron-auth.ts`).
- `generated_content` — immutable LLM output. `null` until `status='completed'`. Set once.
- `edited_content` — always the latest version. Starts equal to `generated_content` (same worker write). Updated on vet edits. Snapshots of every edit go to `report_versions`.
- `updated_by` — populated by PATCH (last editor's user_id).
- `error_message`, `generation_started_at`, `generation_completed_at` — populated by the worker.
- `raw_input` — original vet findings, immutable.
- `org_id` — every domain row (pets, clients, client_vets, reports, report_images) — FK to organizations, NOT NULL.
- Reports remain editable after generation. PATCH writes a `report_versions` snapshot, updates `edited_content`, `updated_by`, drops `pdf_storage_path`.
- Reports are historical documents. Patient/client/vet data is **snapshot text** on the report row — display always reads from these snapshot columns, never from joined tables. The silent FK columns (`pet_id`, `client_id`, `vet_id`) write back to source entities on save — never used for display.
- Profile uniqueness: `cpf` is UNIQUE; `(crmv, crmv_state)` is UNIQUE. Prevents one vet from holding multiple accounts.
- Profile fields `cpf`, `crmv`, `crmv_state` are collected at signup/onboarding only and immutable afterwards (`NOT NULL` in the DB, read-only in the profile UI, and `PUT /api/profile` updates only `full_name` + signature fields — it 404s if the profile row doesn't exist).
- All patient/report fields (`breed`, `age`, `sex`, `neutered`, `clientName`, `responsibleVet`, `examDate`) are required — never nullable. `sex`/`neutered`/`exam_date` are `NOT NULL` at the DB level (pets + reports) and validated in `createReport` and both pets routes.
- Dropdown options (`SPECIES_OPTIONS`, `SEX_OPTIONS`, `sexLabel`) centralized in `shared/constants.ts`.

## Types

- Shared field sets: `PatientFields`, `ReportFields` in `shared/models.ts` — reuse via `extends`.
- API request bodies: `GenerateRequest`, `PetRequest`, `UpdateReportRequest`, `UpdateProfileRequest` — always type `req.json()`.
- API response bodies in `shared/interfaces.ts`. `ApiResponse` is the base error-bearing shape.
- Status: write via `REPORT_STATUSES.<x>`, read via the `ReportStatus` union.
- Required field validation: use a `required` array + loop, not repeated if/return blocks.

## Rules

- Do not add inline comments unless the logic is genuinely non-obvious.
- Do not create new files when editing an existing one suffices.
- Do not use `@react-pdf/renderer` — removed from the project.
- No dead code, no engineering for the future. If it's not called, delete it.
- Never use string literals for table names, bucket names, or enum values — use the const objects above.
- The Next.js 16 "params is async — add await" validator hook is a false positive on `withApiHandler` routes. The wrapper pre-awaits `ctx.params`; handlers receive the resolved object.
