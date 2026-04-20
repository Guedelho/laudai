import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";
import {
  SECTION_TEMPLATES,
  buildDefaults,
  NOMENCLATURE,
  FRASES_SALVADORAS,
  buildConclusionPrompt,
  buildVerifierPrompt,
} from "@/lib/templates";
import { SECTION_MODEL, CONCLUSION_MODEL, VERIFIER_MODEL } from "@/shared/constants";
import type { GenerateParams } from "@/shared/interfaces";

export const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

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

const SECTION_TO_NOMENCLATURE_KEY: Record<string, keyof typeof NOMENCLATURE> = {
  FÍGADO: "liver",
  "VESÍCULA BILIAR": "gallbladder",
  BAÇO: "spleen",
  PÂNCREAS: "pancreas",
  ADRENAIS: "adrenals",
  ESTÔMAGO: "stomach",
  "ALÇAS INTESTINAIS": "intestines",
  "RIM ESQUERDO": "kidneys",
  "RIM DIREITO": "kidneys",
  BEXIGA: "bladder",
  ÚTERO: "uterus",
  OVÁRIOS: "ovaries",
  PRÓSTATA: "prostate",
  "TESTÍCULO DIREITO": "testicles",
  "TESTÍCULO ESQUERDO": "testicles",
  LINFONODOS: "lymphnodes",
};

function parseDefaultsToMap(defaults: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const block of defaults.split(/\n\n+/)) {
    const colon = block.indexOf(":");
    if (colon === -1) continue;
    map.set(block.slice(0, colon).trim(), block.slice(colon + 1).trim());
  }
  return map;
}

function buildFilteredNomenclature(sectionsJson: string, defaults: string): string {
  let sections: Array<{ label: string; content: string }>;
  try {
    sections = JSON.parse(sectionsJson).sections ?? [];
  } catch {
    return FULL_NOMENCLATURE;
  }

  const defaultsMap = parseDefaultsToMap(defaults);
  const seenKeys = new Set<keyof typeof NOMENCLATURE>();

  for (const section of sections) {
    const defaultContent = defaultsMap.get(section.label);
    if (defaultContent !== undefined && section.content.trim() === defaultContent.trim()) continue;
    const key = SECTION_TO_NOMENCLATURE_KEY[section.label];
    if (key) seenKeys.add(key);
  }

  if (seenKeys.size === 0) return FRASES_SALVADORAS;

  const parts = ["REFERÊNCIA DE ACHADOS POR ÓRGÃO:\n"];
  for (const key of seenKeys) parts.push(NOMENCLATURE[key]);
  parts.push("\n" + FRASES_SALVADORAS);
  return parts.join("\n\n");
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
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryable(err) || attempt === maxRetries) throw err;
      lastErr = err;
      onRetry?.();
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastErr;
}

async function generateSections(
  rawInput: string,
  defaults: string,
  patientName: string,
  species: string,
  breed: string,
  age: string,
  sex: string,
  neutered: boolean,
  ownerName: string,
  onChunk?: (chunk: string) => void,
  onRetry?: () => void,
): Promise<string> {
  const model = getModel(SECTION_MODEL, SECTION_TEMPLATES["ultrasound_abdominal"](defaults));

  const userMessage =
    `Achados do exame:\n${rawInput}\n\n` +
    `Dados do paciente: ${patientName}, ${species}, ${breed}, ${age}, ` +
    `${sex === "M" ? "Macho" : "Fêmea"}, ${neutered ? "castrado(a)" : "não castrado(a)"}, ` +
    `responsável: ${ownerName}.\n\nGere o array de sections.`;

  return withRetry(
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
    onRetry,
  );
}

async function generateConclusion(
  rawInput: string,
  sectionsJson: string,
  species: string,
  nomenclature: string,
): Promise<string> {
  const model = getModel(CONCLUSION_MODEL, buildConclusionPrompt(nomenclature, species));

  const userMessage =
    `Achados do veterinário:\n${rawInput}\n\n` +
    `Seções geradas:\n${sectionsJson}\n\n` +
    `Gere conclusion, impression e recommendations.`;

  return withRetry(async () => {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig,
    });
    return result.response.text();
  });
}

export async function generateLaudo(params: GenerateParams): Promise<string> {
  const { rawInput, patientName, species, breed, age, sex, neutered, ownerName, onStatus, onChunk } = params;

  const resolvedDefaults = buildDefaults(sex, neutered);

  // Stage 1: generate sections (streaming)
  onStatus?.("generating");
  const sectionsRaw = await generateSections(
    rawInput,
    resolvedDefaults,
    patientName,
    species,
    breed,
    age,
    sex,
    neutered ?? false,
    ownerName,
    onChunk,
    () => onStatus?.("retrying"),
  );

  // Stage 2: generate conclusion (with nomenclature filtered to altered organs only)
  onStatus?.("concluding");
  const filteredNomenclature = buildFilteredNomenclature(sectionsRaw, resolvedDefaults);
  const conclusionRaw = await generateConclusion(rawInput, sectionsRaw, species, filteredNomenclature);

  // Merge sections + conclusion into full laudo
  const mergedJson = JSON.stringify({
    ...JSON.parse(sectionsRaw.trim()),
    ...JSON.parse(conclusionRaw.trim()),
  });

  let verified = mergedJson;

  // Stage 3: verify
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
                text: `INPUT ORIGINAL DO VETERINÁRIO:\n${rawInput}\n\nLAUDO GERADO (JSON):\n${mergedJson}\n\nRetorne o objeto JSON corrigido.`,
              },
            ],
          },
        ],
        generationConfig,
      });
      return result.response.text();
    });
  } catch (err) {
    console.error("Verifier failed, using merged:", err);
  }

  try {
    const parsed = JSON.parse(verified.trim());
    if (parsed.conclusion) {
      parsed.conclusion = parsed.conclusion.replace(/\n*(?:Assinatura|CRMV|Médico Veterinário)[^\n]*/gi, "").trim();
    }
    return JSON.stringify(parsed);
  } catch {
    return verified;
  }
}
