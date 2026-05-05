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

// ─── Signed-URL TTLs (seconds) ──────────────────────────────────────────────

export const SIGNED_URL_TTL = {
  /** Listing/display: long enough for a logged-in session to finish reviewing. */
  display: 7200,
  /** Server-to-server short-lived fetch (PDF cache, profile assets). */
  serverFetch: 300,
  /** One-shot fetch within the same request handler. */
  oneShot: 60,
} as const;
