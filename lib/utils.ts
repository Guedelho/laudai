import { SEX_OPTIONS } from "@/shared/constants";
import { ParsedLaudo } from "@/shared/models";

export function sexLabel(value: string): string {
  return SEX_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function parseLaudoContent(content: string): ParsedLaudo {
  const parsed = JSON.parse(content.trim());
  if (parsed && Array.isArray(parsed.sections)) {
    return parsed as ParsedLaudo;
  }
  throw new Error("Estrutura de laudo inválida");
}
