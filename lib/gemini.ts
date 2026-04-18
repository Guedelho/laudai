import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
import { TEMPLATES, buildDefaults, NOMENCLATURE, FRASES_SALVADORAS, buildVerifierPrompt } from "@/lib/templates";
import { extractJson } from "@/lib/parseLaudo";
import { DRAFT_MODEL, VERIFIER_MODEL, MEASUREMENT_RE, CLASSIFICATION_LABELS } from "@/shared/constants";
import type { GenerateParams } from "@/shared/interfaces";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

const generationConfig: GenerationConfig = {
  responseMimeType: "application/json",
  temperature: 0,
  topP: 0.95,
  topK: 1,
};

const modelCache = new Map<string, ReturnType<typeof genAI.getGenerativeModel>>();

function getModel(modelId: string, systemInstruction: string) {
  const key = `${modelId}::${systemInstruction}`;
  let model = modelCache.get(key);
  if (!model) {
    model = genAI.getGenerativeModel({ model: modelId, systemInstruction }, { apiVersion: "v1beta" });
    modelCache.set(key, model);
  }
  return model;
}

const FULL_NOMENCLATURE = `REFERÊNCIA DE ACHADOS POR ÓRGÃO:\n\n${Object.values(NOMENCLATURE).join("\n\n")}\n\n${FRASES_SALVADORAS}`;

function scrubMeasurements(json: string, rawInput: string): string {
  const inputMeasurements = new Set((rawInput.match(MEASUREMENT_RE) ?? []).map((m) => m.replace(/\s+/g, "")));
  return json.replace(MEASUREMENT_RE, (match) => {
    const normalized = match.replace(/\s+/g, "");
    return inputMeasurements.has(normalized) ? match : "";
  });
}

function scrubClassificationLabels(json: string): string {
  let result = json;
  for (const re of CLASSIFICATION_LABELS) {
    result = result.replace(re, "");
  }
  return result.replace(/ {2,}/g, " ");
}

function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message;
    return (
      msg.includes("429") ||
      msg.includes("500") ||
      msg.includes("503") ||
      msg.includes("ECONNRESET") ||
      msg.includes("fetch")
    );
  }
  return false;
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, onRetry?: () => void): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries || !isRetryable(err)) throw err;
      onRetry?.();
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}

export async function generateLaudo(params: GenerateParams): Promise<string> {
  const { specialty, rawInput, patientName, species, breed, age, sex, neutered, ownerName, onStatus, onChunk } = params;

  const resolvedDefaults = buildDefaults(sex, neutered);

  const systemPrompt = TEMPLATES[specialty]
    .replace(/{nomenclature}/g, FULL_NOMENCLATURE)
    .replace(/{defaults}/g, resolvedDefaults)
    .replace(/{especie}/g, species);

  const model = getModel(DRAFT_MODEL, systemPrompt);

  const userMessage = `Alterações encontradas no exame:\n\n${rawInput}\n\nDados do paciente: ${patientName}, ${species}, ${breed}, ${age}, ${sex === "M" ? "Macho" : "Fêmea"}, ${neutered ? "castrado(a)" : "não castrado(a)"}, responsável: ${ownerName}.\n\nGere o laudo completo. Mantenha o texto padrão para todas as seções não mencionadas. Para as seções mencionadas, aplique as alterações informadas.`;

  onStatus?.("generating");

  const draft = await withRetry(
    async () => {
      const stream = await model.generateContentStream({
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig,
      });
      let text = "";
      for await (const chunk of stream.stream) {
        const delta = chunk.text();
        if (delta) {
          text += delta;
          onChunk?.(delta);
        }
      }
      return text;
    },
    2,
    () => onStatus?.("retrying"),
  );

  let verified = draft;

  onStatus?.("reviewing");

  try {
    const verifier = getModel(VERIFIER_MODEL, buildVerifierPrompt(resolvedDefaults));
    verified = await withRetry(async () => {
      const result = await verifier.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `INPUT ORIGINAL DO VETERINÁRIO:\n${rawInput}\n\nLAUDO GERADO (JSON):\n${draft}\n\nRetorne o objeto JSON corrigido.`,
              },
            ],
          },
        ],
        generationConfig,
      });
      return result.response.text();
    });
  } catch (err) {
    console.error("Verifier failed, using draft:", err);
    verified = draft;
  }

  try {
    const raw = extractJson(verified);
    let cleaned = scrubMeasurements(raw, rawInput);
    cleaned = scrubClassificationLabels(cleaned);
    const parsed = JSON.parse(cleaned);
    return JSON.stringify(parsed);
  } catch {
    return verified;
  }
}
