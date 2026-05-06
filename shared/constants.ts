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
