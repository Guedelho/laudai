@AGENTS.md

## Project context

**laudai** — veterinary ultrasound report generator. UI and all report content are in Portuguese (pt-BR). Users are veterinarians; the app generates structured reports (laudos) from short dictated findings.

## Naming convention

- **Internal code** (types, variables, functions, files, routes): use "report" (English).
- **UI copy** (labels, error messages, placeholders): use "laudo" (Portuguese).

## Constants — never use string literals for these

All schema names, statuses, buckets, plan ids, audit actions, etc. live in const objects. Always import + use them.

- `TABLES.*` (e.g. `TABLES.reports`, `TABLES.audit_log`) — `shared/constants.ts`
- `STORAGE_BUCKETS.*` (`reportImages`, `reportPdfs`, `profileLogos`) — `shared/constants.ts`
- `REPORT_STATUSES.*` — `shared/models.ts`
- `AUDIT_ACTIONS.*`, `AUDIT_ENTITIES.*` — `lib/audit.ts`
- `LEGAL_VERSIONS.*` (terms / privacy_policy version timestamps)
- `SIGNED_URL_TTL.*` (`display` / `serverFetch` / `oneShot`)

## Stack

- **Next.js 16 App Router** — Tailwind 4 (PostCSS-based, no `tailwind.config.*`), Supabase SSR via `@supabase/ssr`. `cacheComponents: true`.
- **AI**: `lib/report/generate.ts` makes a single Gemini call per report (`gemini-3-flash-preview`) with a combined system prompt (sections + conclusion + verifier constraints). Streaming via `generateContentStream` with `responseMimeType: "application/json"` — chunks are concatenated server-side; the client never sees the stream. Retry with exponential backoff on transient errors (429/500/503/ECONNRESET). `temperature: 0`. Trechos derivados dos achados do usuário são marcados pelo modelo com `**...**`; `splitBoldSegments` (em `lib/utils.ts`) converte esses marcadores em runs em negrito tanto no PDF quanto na visualização.
- **Async generation**: `POST /api/generate` validates input, inserts a `reports` row with `status='pending'`, schedules the Gemini call via Next.js `after()`, returns `{ reportId }` immediately. `lib/report/worker.ts` (`runGeneration`) flips the row through `generating → completed | failed` and calls `revalidateTag(reportCacheTag(id), "max")` on completion. The worker uses `Promise.race` with a 5-minute timeout — caught failures get reported back to the user fast. The dashboard subscribes to a Supabase Realtime **Broadcast** channel `org:<org_id>:reports` (private) and listens for the `report_changed` event. Events are emitted by the `reports_broadcast` Postgres trigger via `realtime.send()` — Broadcast is used instead of `postgres_changes` because the latter evaluates table RLS through `realtime.apply_rls`, where any recursive policy chain (e.g. `organization_members`) aborts the entire stream. Authorization on `realtime.messages` is gated by `is_org_member` (security definer) so teammates also receive updates; solo users are orgs-of-1. Failed laudos retry via `POST /api/reports/[id]/regenerate` (only allowed when `status='failed'`).
- **Speech-to-text**: real-time via browser Web Speech API (`react-speech-recognition`). Mic + transcript in `NewReportForm.tsx`. Firefox shows a disabled state with tooltip; no server-side transcription.
- **PDF**: `lib/report/pdf.ts` (pdfmake). Fonts fetched from CDN and cached module-level. Cached in `STORAGE_BUCKETS.reportPdfs` with a `pdf_cached_at` timestamp; reads treat the cache as a miss after `PDF_CACHE_TTL_MS` (24h) and regenerate. Cache is also invalidated on report edit, image changes, and profile changes. PDFs are signed/served using the _original author's_ profile (logo, signature, CRMV stay theirs even when a teammate edits). Print/download flow uses `openReportPdfTab` (`lib/pdf-tab.ts`): fetch in current tab so BotID headers attach, then hand bytes to a popup as a blob URL — `window.open('/api/.../pdf')` directly would fail BotID (the new tab has no Next.js JS).
- **Profile images** (logo/signature): served by `serveProfileImage` (`lib/profile-image.ts`) which streams bytes through the API route rather than redirecting to a signed URL. Browsers cache redirects, and the signed URL target expires after `SIGNED_URL_TTL.serverFetch` seconds, so cached redirects break. The route opts out of BotID (`{ botId: false }`) because `<img src>` is a browser-native request without BotID headers.
- **Bot protection**: Vercel BotID is on by default for every `withApiHandler` route. Routes hit by browser-native mechanisms (`<img>`, `<a download>`, top-level navigation) opt out with `withApiHandler(..., { botId: false })` — currently `/api/profile/logo`, `/api/profile/signature`, `/api/account/export`. `instrumentation-client.ts` injects detection headers for all `/api/*` paths; `deepAnalysis` mode is enabled on `/api/generate` and `/api/reports/*/regenerate` (the Gemini-cost endpoints).
- **Formatting**: Prettier + pre-commit hook via lint-staged. Run `npm run format` to format all files.
- **Database**: Supabase Postgres (project `rgemiayidnumeotplozm`, region `sa-east-1`). Multi-tenant via `organizations`. Every domain table (`pets`, `clinics`, `clinic_vets`, `reports`, `report_images`) has `org_id NOT NULL` + `user_id NOT NULL`. RLS: reads scope by org membership (team-visible); mutations stay user_id-self (only creator edits). All FK / `user_id` / `org_id` columns are indexed.
- **Storage**: Three private buckets — `STORAGE_BUCKETS.reportImages`, `STORAGE_BUCKETS.reportPdfs`, `STORAGE_BUCKETS.profileLogos`. RLS scopes anon-client access to `auth.uid() = first folder in path`. All writes via service role.
- **Auth**: Supabase Auth via cookies (SSR). `proxy.ts` syncs session and redirects unauthenticated users to `/login` (except `/legal/*`). `/signup` exists but is disabled — page redirects to `/login`. `withApiHandler` uses `getUserId()` from `@/lib/supabase/auth` — cookie-only, no Bearer tokens.
- **Deployment**: Vercel. Git auto-deploy is enabled — pushes to `main` deploy automatically. Personal repo (`Guedelho/laudai`); push as the `Guedelho` gh account.

## Multi-tenancy

Every user belongs to ≥1 organization. Solo users get an org-of-1 (basic plan, they are the owner) — invisible plumbing. The concept only surfaces in UI when they invite a teammate or upgrade.

- `organizations` — id, name, slug, plan (FK to `plans`), owner_user_id, deleted_at
- `organization_members` — (org_id, user_id) PK, role ∈ {`owner`, `admin`, `member`}. Partial unique index ensures one owner per org
- `organization_invitations` — pending invitations with token + expires_at; partial unique on (org_id, email) where not accepted
- `plans` — catalog table seeded with `basic`, `professional`, `teams`. `organizations.plan` references it (FK, on update cascade)

Helpers:

- `getCurrentOrgId(userId)` in `lib/supabase/auth.ts` — returns the user's primary org (owned first, then any membership). Until the org switcher is built, this is the "current" org for every request.
- `create_solo_org(userId, name, slug)` — SQL function (revoked from anon/authenticated). Atomically inserts the org + owner membership.

Plan enforcement (member counts, features) is **application-level** — no quotas in DB. Plans store only display metadata.

## Audit log

`audit_log` is the polymorphic append-only record of every create/update/delete on domain entities (`pet`, `clinic`, `clinic_vet`, `report`, `report_image`, `profile`, `organization_member`). Every mutation endpoint writes one via the `audit()` helper that `withApiHandler` provides in ctx (auto-bound to the request's userId + orgId).

```ts
await audit({ action: AUDIT_ACTIONS.delete, entityType: AUDIT_ENTITIES.pet, entityId: id, changes: before });
```

RLS: org members read; insert is gated to `user_id = auth.uid()` (no impersonation). No UPDATE/DELETE policies — entries are immutable for authenticated users.

## Report version history

`report_versions` is append-only. PATCH `/api/reports/[id]` looks up the current max version, inserts a snapshot of the new `edited_content` as `version + 1`, then updates `reports.edited_content` + `updated_by` in place. The "latest" view is always `reports.edited_content` — `report_versions` is only read on "Ver histórico" / compliance export. Versioning started May 2026; earlier edits were not reconstructed.

## 30-day deletion (LGPD)

`DELETE /api/account` does **not** immediately purge. It sets `profiles.deletion_scheduled_at = now()` and returns 202. The user can still log in and `POST /api/account` to cancel (clears the timestamp). Daily at 03:00 UTC, `/api/internal/sweep-deleted-accounts` finds rows past `now() - 30 days` and hard-deletes: storage objects in all three buckets + `admin.auth.admin.deleteUser` (which cascades DB rows via FKs).

## Page structure

All authenticated pages live inside `app/(auth)/`. The route group layout handles auth check + `<AppHeader />` + outer wrapper. Public pages: `/login`, `/legal/*` (politica-de-privacidade, termos-de-uso), `/signup` (disabled, redirects to `/login`).

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

`withApiHandler` runs: BotID check (unless `{ botId: false }`) → auth → org lookup → 500 fallback. Cron routes don't use `withApiHandler` — they're plain `GET` exports gated by `Bearer ${CRON_SECRET}` (no user/org context).

CSRF protection is handled by Supabase's `SameSite=Lax` cookies plus modern browser defaults — no custom check. Rate limiting is delegated to the Vercel Firewall (dashboard-configurable per route).

**Scope rules:**

- Reads: filter by `org_id` (team-visible). Use `.eq("org_id", orgId)`.
- Mutations (UPDATE/DELETE): filter by `user_id` (only the row's author can mutate). Use `.eq("user_id", userId)`.
- Inserts: always set both `user_id: userId` and `org_id: orgId`.
- FK ownership: `resolveOwnedFks(admin, orgId, ids)` filters incoming petId/clinicId/vetId to those in the caller's org.

**Other:**

- Image validation: server-side via `sharp` magic-byte detection (not `file.type`).
- Errors: `logError("...", err, { userId, ... })` from `@/lib/log` (structured JSON to stdout — Vercel parses). Return generic Portuguese message to the client.
- Cache invalidation: `revalidateTag(reportCacheTag(id), "max")` — never hand-build `report-${id}` strings.
- Profile mutations call `invalidateUserPdfCache(admin, userId)` to clear cached PDFs (logo/signature/name/CRMV are baked into the PDF, per author).

## Client-side conventions

- Auth via cookies (`@supabase/ssr`) — no manual auth headers on fetch calls.
- API calls: typed functions in `lib/services/` (pets, clinics, reports, profile) — never inline `fetch()` in components.
- JSON requests: add `"Content-Type": "application/json"`. FormData requests need no extra headers.

## Data model

- `status` ∈ `REPORT_STATUSES.{pending, generating, completed, failed}`. Set by `/api/generate` (`pending`), the worker (`generating` → terminal), or regenerate (back to `pending`). Pre-async-migration rows default to `completed`. The worker's 5-minute `Promise.race` timeout catches Gemini hangs; there is no fallback cron sweeper for stuck rows.
- `generated_content` — immutable LLM output. `null` until `status='completed'`. Set once.
- `edited_content` — always the latest version. Starts equal to `generated_content` (same worker write). Updated on vet edits. Snapshots of every edit go to `report_versions`.
- `updated_by` — populated by PATCH (last editor's user_id).
- `error_message`, `generation_started_at`, `generation_completed_at` — populated by the worker.
- `raw_input` — original vet findings, immutable.
- `org_id` — every domain row (pets, clinics, clinic_vets, reports, report_images) — FK to organizations, NOT NULL.
- Reports remain editable after generation. PATCH writes a `report_versions` snapshot, updates `edited_content`, `updated_by`, drops `pdf_storage_path`.
- Reports are historical documents. Patient/clinic/vet data is **snapshot text** on the report row — display always reads from these snapshot columns, never from joined tables. The silent FK columns (`pet_id`, `clinic_id`, `vet_id`) write back to source entities on save — never used for display.
- Profile uniqueness: `cpf` is UNIQUE; `(crmv, crmv_state)` is UNIQUE. Prevents one vet from holding multiple accounts.
- Profile fields `cpf`, `crmv`, `crmv_state` are immutable after first profile creation.
- All patient/report fields (`breed`, `age`, `sex`, `neutered`, `clinicName`, `responsibleVet`, `examDate`) are required — never nullable.
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
