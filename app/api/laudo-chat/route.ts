import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { withApiHandler } from "@/lib/api-handler";
import { GENERATE_MODEL } from "@/shared/constants";
import type { ParsedReport } from "@/shared/models";

interface ReportCtx {
  patientName: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
  ownerName: string;
  clientName: string;
  responsibleVet: string;
  examDate: string;
  content: ParsedReport;
}

function buildSystem(r: ReportCtx): string {
  const sexLabel = r.sex === "M" ? "Macho" : "Fêmea";
  const neuteredLabel = r.neutered
    ? r.sex === "M"
      ? "castrado"
      : "castrada"
    : r.sex === "M"
      ? "não castrado"
      : "não castrada";
  const displayDate = new Date(r.examDate + "T12:00:00").toLocaleDateString("pt-BR");

  const sections = r.content.sections.map((s) => `**${s.label}:** ${s.content}`).join("\n");
  const impression = r.content.impression?.length
    ? `\n**IMPRESSÃO DIAGNÓSTICA:**\n${r.content.impression.map((i) => `• ${i}`).join("\n")}`
    : "";
  const recommendations = r.content.recommendations?.length
    ? `\n**RECOMENDAÇÕES:**\n${r.content.recommendations.map((i) => `• ${i}`).join("\n")}`
    : "";
  const observations = r.content.observations?.length ? `\n**OBS:** ${r.content.observations.join(" ")}` : "";
  const conclusion = r.content.conclusion ? `\n**CONCLUSÃO:** ${r.content.conclusion}` : "";

  return `Você é um assistente especialista em medicina veterinária, com foco em ultrassonografia abdominal. Um médico veterinário está revisando o laudo abaixo e pode ter dúvidas sobre os achados.

**Paciente:** ${r.patientName} — ${r.species}, ${r.breed}, ${r.age}, ${sexLabel}, ${neuteredLabel}
**Tutor:** ${r.ownerName}
**Cliente/Clínica:** ${r.clientName}
**Médico responsável:** ${r.responsibleVet}
**Data do exame:** ${displayDate}

--- LAUDO ---
${sections}${conclusion}${impression}${recommendations}${observations}
--- FIM DO LAUDO ---

Responda em português (pt-BR), de forma objetiva e clínica. Você pode:
- Explicar termos médicos e achados do laudo
- Comentar sobre valores de referência e o que é normal vs. alterado para a espécie/raça/idade
- Sugerir diagnósticos diferenciais compatíveis com os achados
- Indicar quando exames complementares seriam pertinentes
- Esclarecer qualquer dúvida relacionada ao exame ou ao conteúdo gerado

Não reescreva o laudo completo. Responda apenas o que for perguntado, de forma direta e concisa.`;
}

export const maxDuration = 60;

export const POST = withApiHandler(
  async ({ req }) => {
    const { messages, report }: { messages: UIMessage[]; report: ReportCtx } = await req.json();

    const result = streamText({
      model: google(GENERATE_MODEL),
      system: buildSystem(report),
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  },
  { rateLimit: { endpoint: "laudo.review", max: 30, windowSec: 60 } },
);
