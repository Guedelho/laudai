import { SEX_OPTIONS } from "@/shared/constants";
import { ParsedReport, Pet } from "@/shared/models";

export function brazilToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

// Exam dates are stored as YYYY-MM-DD strings. Anchor to noon so the date
// doesn't shift across timezones when the browser formats it.
export function formatExamDate(date: string): string {
  return new Date(date + "T12:00:00").toLocaleDateString("pt-BR");
}

export function sexLabel(value: string): string {
  return SEX_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function reportCacheTag(id: string): string {
  return `report-${id}`;
}

export function uniqueBreeds(pets: Pick<Pet, "breed">[]): string[] {
  return [...new Set(pets.map((p) => p.breed).filter(Boolean) as string[])].sort();
}

export function parseReportContent(content: string): ParsedReport {
  const parsed = JSON.parse(content.trim());
  if (parsed && Array.isArray(parsed.sections)) {
    return parsed as ParsedReport;
  }
  throw new Error("Estrutura de laudo inválida");
}

interface TextSegment {
  text: string;
  bold: boolean;
}

export function splitBoldSegments(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const regex = /\*\*([\s\S]+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ text: text.slice(lastIndex, match.index), bold: false });
    segments.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ text: text.slice(lastIndex), bold: false });
  return segments.length ? segments : [{ text, bold: false }];
}
