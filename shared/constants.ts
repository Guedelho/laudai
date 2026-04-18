// ─── UI ──────────────────────────────────────────────────────────────────────

export const SPECIES_OPTIONS = [
  { value: "Canina", label: "Canina" },
  { value: "Felina", label: "Felina" },
] as const;

export const SEX_OPTIONS = [
  { value: "M", label: "Macho" },
  { value: "F", label: "Fêmea" },
] as const;

// ─── Gemini ──────────────────────────────────────────────────────────────────

export const DRAFT_MODEL = "gemini-3.1-pro-preview";
export const VERIFIER_MODEL = "gemini-3-flash-preview";
export const TRANSCRIBE_MODEL = "gemini-3-flash-preview";

// ─── Scrubber patterns ───────────────────────────────────────────────────────

export const MEASUREMENT_RE = /\d+[.,]\d+\s*(cm|mm)/gi;

export const CLASSIFICATION_LABELS = [
  /hepatomegalia\s+[IV]+/gi,
  /microhepatia\s+[IV]+/gi,
  /hipoecog[eê]nico\s+[IV]+/gi,
  /hiperecog[eê]nico\s+[IV]+/gi,
  /nefropatia\s+cr[oô]nica\s+[IV]+/gi,
  /mucocele\s+[IV]+/gi,
  /cistos?\s+[IV]+/gi,
  /hiperplasia\s+endometrial\s+c[ií]stica\s+[IV]+/gi,
  /atrofia\s+testicular\s+[IV]+/gi,
  /l[ií]quido\s+livre\s+[IV]+/gi,
  /descontinuidade\s+da\s+parede\s+[IV/]+/gi,
];
