export const SPECIES_OPTIONS = [
  { value: "Canina", label: "Canina" },
  { value: "Felina", label: "Felina" },
] as const;

export const SEX_OPTIONS = [
  { value: "M", label: "Macho" },
  { value: "F", label: "Fêmea" },
] as const;

export function sexLabel(value: string): string {
  return SEX_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
