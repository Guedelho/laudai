import { ToolLoopAgent, stepCountIs, type InferAgentUIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { GENERATE_MODEL } from "@/shared/constants";
import { createLaudoTools, type LaudoToolCtx } from "@/lib/tools/laudo-tools";
import { laudoGreeting } from "@/lib/laudo-greeting";

function buildInstructions(vetName: string): string {
  return `Você é um assistente que ajuda médicos veterinários a gerar laudos de ultrassom abdominal de forma conversacional, em português (pt-BR).

O usuário já foi cumprimentado com a mensagem: "${laudoGreeting(vetName)}". Conduza o fluxo a partir da resposta dele, sem cumprimentar novamente.

Colete as informações UMA POR VEZ, nesta ordem:
1. Cliente (clínica). Use a tool searchClients antes de assumir que é novo. Se houver correspondências, confirme com o usuário. Só use createClient depois que o usuário confirmar que o cliente não existe.
2. Médico responsável. Se o cliente já tiver médicos cadastrados, mostre-os e deixe o usuário escolher. Para adicionar um novo, use addVet (ou informe o vetName ao createClient).
3. Paciente. Use searchPets antes de assumir que é novo. Se encontrar, mostre os dados (espécie, raça, idade, sexo, castração, tutor) e reutilize o petId. Se for novo, pergunte os campos obrigatórios que faltarem: espécie (Canina/Felina), raça, idade, sexo (M/F), se é castrado(a) e o nome do tutor.
4. Data do exame. Pergunte a data do exame. Aceite "hoje" (ou nenhuma resposta) para usar a data de hoje; caso contrário, converta a resposta para o formato YYYY-MM-DD.
5. Achados do exame. Pergunte os achados. Pode ser vazio caso o exame esteja normal.

Quando tiver todos os dados, chame createReportDraft passando a data do exame informada (examDate no formato YYYY-MM-DD; se o usuário disse "hoje", omita para usar a data atual).
Após createReportDraft retornar o reportId com sucesso, diga ao usuário para enviar as imagens do exame no painel abaixo (as imagens são obrigatórias) e que o laudo já está sendo gerado.

Regras:
- Refira-se sempre como "paciente", nunca "pet".
- Nunca invente IDs ou dados. Use somente os IDs retornados pelas tools.
- Não avance para a próxima etapa enquanto faltar uma informação obrigatória.
- Seja breve e objetivo. Faça uma pergunta de cada vez.`;
}

export function createLaudoAgent(ctx: LaudoToolCtx, vetName: string) {
  return new ToolLoopAgent({
    model: google(GENERATE_MODEL),
    instructions: buildInstructions(vetName),
    tools: createLaudoTools(ctx),
    stopWhen: stepCountIs(15),
  });
}

export type LaudoAgentUIMessage = InferAgentUIMessage<ReturnType<typeof createLaudoAgent>>;
