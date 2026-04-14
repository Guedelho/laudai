import { GoogleGenerativeAI } from "@google/generative-ai";
import { TEMPLATES, DEFAULTS } from "@/lib/templates";
import { extractJson } from "@/lib/parseLaudo";
import { Specialty } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const generationConfig = { responseMimeType: "application/json" } as Record<string, unknown>;

// Cache model instances per system prompt to avoid re-creation on every call
const modelCache = new Map<string, ReturnType<typeof genAI.getGenerativeModel>>();

function getModel(systemInstruction: string) {
  let model = modelCache.get(systemInstruction);
  if (!model) {
    model = genAI.getGenerativeModel(
      { model: "gemini-3-flash-preview", systemInstruction },
      { apiVersion: "v1beta" },
    );
    modelCache.set(systemInstruction, model);
  }
  return model;
}

interface GenerateParams {
  specialty: Specialty;
  rawInput: string;
  patientName: string;
  species: string;
  breed?: string;
  age?: string;
  ownerName: string;
  veterinarian: string;
  crmv: string;
  onStatus?: (status: "generating" | "reviewing") => void;
}

export async function generateLaudo(params: GenerateParams): Promise<string> {
  const { specialty, rawInput, patientName, species, breed, age, ownerName, veterinarian, crmv, onStatus } = params;

  const today = new Date().toLocaleDateString("pt-BR");
  const systemPrompt = TEMPLATES[specialty]
    .replace(/{defaults}/g, DEFAULTS[specialty] ?? "")
    .replace(/{data}/g, today)
    .replace(/{paciente}/g, patientName)
    .replace(/{especie}/g, species)
    .replace(/{raca}/g, breed ?? "Não informada")
    .replace(/{idade}/g, age ?? "Não informada")
    .replace(/{tutor}/g, ownerName)
    .replace(/{veterinario}/g, veterinarian)
    .replace(/{crmv}/g, crmv);

  const model = getModel(systemPrompt);

  const userMessage = rawInput.trim()
    ? `Alterações encontradas no exame:\n\n${rawInput}\n\nGere o laudo completo. Mantenha o texto padrão para todas as seções não mencionadas. Para as seções mencionadas, aplique as alterações informadas. Se houver medidas específicas, substitua os valores de referência (x cm, 0,00) pelos valores reais informados.`
    : `Nenhuma alteração encontrada. Gere o laudo completo utilizando apenas os textos padrão para todas as seções.`;

  onStatus?.("generating");
  const draft = (await model.generateContent({ contents: [{ role: "user", parts: [{ text: userMessage }] }], generationConfig })).response.text();

  let verified = draft;

  if (rawInput.trim()) {
    onStatus?.("reviewing");
    const defaults = DEFAULTS[specialty] ?? "";

    // Verification agent: strip hallucinated findings not in the original input
    try {
      const verifier = getModel(
            "Retorne APENAS um objeto JSON válido. Nunca use markdown, asteriscos, blocos de código ou qualquer formatação.\n\n" +
            "Você é um veterinário ultrassonografista sênior revisando um laudo gerado por IA.\n\n" +
            "TEXTO PADRÃO DE REFERÊNCIA (achados normais para cada seção):\n" +
            defaults +
            "\n\nSUAS REGRAS:\n" +
            "1. Seções que correspondem ao texto padrão acima → copie-as EXATAMENTE como estão no laudo, sem nenhuma alteração.\n" +
            "2. Seções alteradas → para cada campo que difere do padrão, avalie como veterinário se a mudança é:\n" +
            "   a) Clinicamente decorrente do achado informado (ex: fígado aumentado de tamanho → margens abauladas é consequência clínica esperada; congestão hepática → vasos de calibre aumentados) → MANTENHA a mudança.\n" +
            "   b) Completamente não relacionada ao achado informado e não esperada clinicamente → RESTAURE o campo do texto padrão.\n" +
            "   Restaure o padrão SOMENTE quando tiver certeza clínica de que a mudança não tem relação com o achado relatado. Em caso de dúvida, mantenha o que foi gerado.\n" +
            "3. Mantenha intactos: impressão diagnóstica e recomendações. NÃO inclua cabeçalho nem assinatura.\n" +
            "Retorne APENAS o objeto JSON corrigido, sem explicações ou comentários.",
      );
      verified = (
        await verifier.generateContent({
          contents: [{ role: "user", parts: [{ text: `INPUT ORIGINAL DO VETERINÁRIO:\n${rawInput}\n\nLAUDO GERADO (JSON):\n${draft}\n\nRetorne o objeto JSON corrigido.` }] }],
          generationConfig,
        })
      ).response.text();
    } catch {
      verified = draft;
    }
  }

  // Parse and re-serialize to ensure we store clean JSON
  try {
    const raw = extractJson(verified);
    const parsed = JSON.parse(raw);
    return JSON.stringify(parsed);
  } catch {
    // If the LLM didn't return valid JSON, return the raw text (parseLaudoContent will handle it)
    return verified;
  }
}
