import { ParsedLaudo } from "@/shared/models";

const SECTION_RE = /^([A-ZÁÂÃÀÉÊÍÓÔÕÚÇ][A-ZÁÂÃÀÉÊÍÓÔÕÚÇ\s\/\-]{0,40}):\s*(.*)/;
const HEADER_RE = /^(ULTRASSONOGRAFI|RELATÓRIO|Data:|Paciente:|Tutor:|Responsável:|Médico Vet|CRMV:|---)/i;
const CONCLUSION_RE = /^CONCLUS[ÃA]O\s*:?\s*$/i;
const IMPRESSAO_RE = /^IMPRESS[ÃA]O\s+DIAGN[ÓO]STICA\s*:?\s*$/i;
const RECOMENDACOES_RE = /^RECOMENDA[ÇC][ÕO]ES\s*:?\s*$/i;

export function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

export function parseLaudoContent(content: string): ParsedLaudo {
  try {
    const raw = extractJson(content);
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.sections)) {
      return parsed as ParsedLaudo;
    }
  } catch {
    // fall through to plain text parsing
  }

  function stripMd(s: string): string {
    return s
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/^\s*[-*]\s+/, "")
      .trim();
  }

  const lines = content.split("\n");
  const sections: ParsedLaudo["sections"] = [];
  const impressao: string[] = [];
  const recomendacoes: string[] = [];
  let conclusion: string | undefined;
  let inImpressao = false;
  let inRecomendacoes = false;
  let inConclusion = false;
  let lastSection: { label: string; content: string } | null = null;

  for (const line of lines) {
    const t = stripMd(line.trim());
    if (!t) {
      if (lastSection) {
        sections.push(lastSection);
        lastSection = null;
      }
      continue;
    }

    if (HEADER_RE.test(t)) continue;

    if (CONCLUSION_RE.test(t)) {
      if (lastSection) {
        sections.push(lastSection);
        lastSection = null;
      }
      inConclusion = true;
      inImpressao = false;
      inRecomendacoes = false;
      continue;
    }
    if (IMPRESSAO_RE.test(t)) {
      if (lastSection) {
        sections.push(lastSection);
        lastSection = null;
      }
      inImpressao = true;
      inRecomendacoes = false;
      inConclusion = false;
      continue;
    }
    if (RECOMENDACOES_RE.test(t)) {
      if (lastSection) {
        sections.push(lastSection);
        lastSection = null;
      }
      inRecomendacoes = true;
      inImpressao = false;
      inConclusion = false;
      continue;
    }

    if (inImpressao) {
      impressao.push(t);
      continue;
    }
    if (inRecomendacoes) {
      recomendacoes.push(t);
      continue;
    }
    if (inConclusion) {
      conclusion = conclusion ? conclusion + " " + t : t;
      continue;
    }

    const m = t.match(SECTION_RE);
    if (m) {
      if (lastSection) sections.push(lastSection);
      lastSection = { label: m[1].trim(), content: m[2].trim() };
    } else if (lastSection) {
      lastSection.content = lastSection.content ? lastSection.content + " " + t : t;
    }
  }
  if (lastSection) sections.push(lastSection);

  return {
    sections,
    conclusion: conclusion || undefined,
    impressao: impressao.length ? impressao : undefined,
    recomendacoes: recomendacoes.length ? recomendacoes : undefined,
    raw: content,
  };
}
