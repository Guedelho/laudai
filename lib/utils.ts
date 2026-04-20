import { SEX_OPTIONS } from "@/shared/constants";
import { ParsedReport } from "@/shared/models";

export function sexLabel(value: string): string {
  return SEX_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function parseReportContent(content: string): ParsedReport {
  const parsed = JSON.parse(content.trim());
  if (parsed && Array.isArray(parsed.sections)) {
    return parsed as ParsedReport;
  }
  throw new Error("Estrutura de laudo inválida");
}
