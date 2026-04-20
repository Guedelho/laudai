import { ParsedLaudo } from "@/shared/models";

export function parseLaudoContent(content: string): ParsedLaudo {
  const parsed = JSON.parse(content.trim());
  if (parsed && Array.isArray(parsed.sections)) {
    return parsed as ParsedLaudo;
  }
  throw new Error("Estrutura de laudo inválida");
}
