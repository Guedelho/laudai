// ─── UI ──────────────────────────────────────────────────────────────────────

export const SPECIES_OPTIONS = [
  { value: "Canina", label: "Canina" },
  { value: "Felina", label: "Felina" },
] as const;

export const SEX_OPTIONS = [
  { value: "M", label: "Macho" },
  { value: "F", label: "Fêmea" },
] as const;

const BR_STATES = [
  { uf: "AC", name: "Acre" },
  { uf: "AL", name: "Alagoas" },
  { uf: "AP", name: "Amapá" },
  { uf: "AM", name: "Amazonas" },
  { uf: "BA", name: "Bahia" },
  { uf: "CE", name: "Ceará" },
  { uf: "DF", name: "Distrito Federal" },
  { uf: "ES", name: "Espírito Santo" },
  { uf: "GO", name: "Goiás" },
  { uf: "MA", name: "Maranhão" },
  { uf: "MT", name: "Mato Grosso" },
  { uf: "MS", name: "Mato Grosso do Sul" },
  { uf: "MG", name: "Minas Gerais" },
  { uf: "PA", name: "Pará" },
  { uf: "PB", name: "Paraíba" },
  { uf: "PR", name: "Paraná" },
  { uf: "PE", name: "Pernambuco" },
  { uf: "PI", name: "Piauí" },
  { uf: "RJ", name: "Rio de Janeiro" },
  { uf: "RN", name: "Rio Grande do Norte" },
  { uf: "RS", name: "Rio Grande do Sul" },
  { uf: "RO", name: "Rondônia" },
  { uf: "RR", name: "Roraima" },
  { uf: "SC", name: "Santa Catarina" },
  { uf: "SP", name: "São Paulo" },
  { uf: "SE", name: "Sergipe" },
  { uf: "TO", name: "Tocantins" },
] as const;

export const CRMV_STATE_OPTIONS = BR_STATES.map((s) => ({ value: s.uf, label: `${s.uf} — ${s.name}` }));

export const BR_STATE_CODES: ReadonlySet<string> = new Set(BR_STATES.map((s) => s.uf));

// ─── AI models ──────────────────────────────────────────────────────────────

export const GENERATE_MODEL = "gemini-3-flash-preview";

export const GEMINI_SAFETY_SETTINGS = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "OFF" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "OFF" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "OFF" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "OFF" },
  { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: "OFF" },
] as const;

// ─── Limits ──────────────────────────────────────────────────────────────────

export const MAX_REPORT_IMAGES = 50;
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const DASHBOARD_PAGE_SIZE = 5;
export const CHAT_HISTORY_PAGE_SIZE = 30;
export const CHAT_SESSION_GAP_MS = 60 * 60 * 1000;

// ─── LGPD ────────────────────────────────────────────────────────────────────
// Bumping a version invalidates prior consent and forces re-acceptance.

export const LEGAL_VERSIONS = {
  terms: "2026-05-18",
  privacy_policy: "2026-05-18",
} as const;

export type LegalDocType = keyof typeof LEGAL_VERSIONS;

// ─── Schema names ───────────────────────────────────────────────────────────

export const TABLES = {
  profiles: "profiles",
  organizations: "organizations",
  organization_members: "organization_members",
  organization_invitations: "organization_invitations",
  organization_report_types: "organization_report_types",
  member_specialties: "member_specialties",
  plans: "plans",
  report_types: "report_types",
  pets: "pets",
  clients: "clients",
  client_vets: "client_vets",
  reports: "reports",
  report_versions: "report_versions",
  report_images: "report_images",
  consents: "consents",
  audit_log: "audit_log",
  rate_limits: "rate_limits",
  chat_messages: "chat_messages",
} as const;

export const REPORT_TYPES = {
  ultrasound_abdominal: "ultrasound_abdominal",
  periodontal_treatment: "periodontal_treatment",
} as const;

export type ReportType = (typeof REPORT_TYPES)[keyof typeof REPORT_TYPES];

// Report types an active subscription grants. Today there is a single product;
// when another type becomes sellable end-to-end, add it here and the Stripe
// webhook will grant/revoke it automatically.
export const SUBSCRIPTION_REPORT_TYPES: readonly ReportType[] = [REPORT_TYPES.ultrasound_abdominal];

export const ORG_ROLES = {
  owner: "owner",
  member: "member",
} as const;

export const REPORT_STATUSES = {
  pending: "pending",
  generating: "generating",
  completed: "completed",
  failed: "failed",
} as const;

export type ReportStatus = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];

// past_due stays entitled so a failed card keeps access during Stripe dunning.
export const ENTITLED_SUBSCRIPTION_STATUSES: ReadonlySet<string> = new Set(["trialing", "active", "past_due"]);

export const STORAGE_BUCKETS = {
  reportImages: "report-images",
  reportPdfs: "report-pdfs",
  profileLogos: "profile-logos",
} as const;

// ─── Signed-URL TTLs (seconds) ──────────────────────────────────────────────

export const SIGNED_URL_TTL = {
  /** Listing/display: long enough for a logged-in session to finish reviewing. */
  display: 7200,
  /** Server-to-server short-lived fetch (PDF cache, profile assets). */
  serverFetch: 300,
  /** One-shot fetch within the same request handler. */
  oneShot: 60,
} as const;

/** Cached PDFs older than this are treated as a miss and regenerated. */
export const PDF_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
