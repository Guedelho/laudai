// ─── UI ──────────────────────────────────────────────────────────────────────

export const SPECIES_OPTIONS = [
  { value: "Canina", label: "Canina" },
  { value: "Felina", label: "Felina" },
] as const;

export const SEX_OPTIONS = [
  { value: "M", label: "Macho" },
  { value: "F", label: "Fêmea" },
] as const;

// ─── AI models ──────────────────────────────────────────────────────────────

export const GENERATE_MODEL = "gemini-3-flash-preview";

// ─── Limits ──────────────────────────────────────────────────────────────────

export const MAX_REPORT_IMAGES = 50;
export const MAX_IMAGE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const DASHBOARD_PAGE_SIZE = 5;

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
  plans: "plans",
  pets: "pets",
  clinics: "clinics",
  clinic_vets: "clinic_vets",
  reports: "reports",
  report_versions: "report_versions",
  report_images: "report_images",
  consents: "consents",
  audit_log: "audit_log",
} as const;

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
