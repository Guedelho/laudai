import { GoogleGenerativeAI, type SafetySetting } from "@google/generative-ai";
import { GENERATE_MODEL, GEMINI_SAFETY_SETTINGS } from "@/shared/constants";
import { buildDefaults, buildSingleCallPrompt } from "@/lib/report/templates";
import { logInfo, logWarn } from "@/lib/log";
import type { GenerateParams } from "@/shared/interfaces";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message;
    return (
      msg.includes("429") ||
      msg.includes("500") ||
      msg.includes("503") ||
      msg.includes("ECONNRESET") ||
      msg.includes("fetch") ||
      msg.includes("content-filter") ||
      msg.includes("SAFETY")
    );
  }
  return false;
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isRetryable(err) || attempt === maxRetries) throw err;
      logWarn("Gemini retry", {
        attempt: attempt + 1,
        maxRetries,
        delayMs: 1000 * (attempt + 1),
        error: err instanceof Error ? err.message : String(err),
      });
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

export async function generateReport(params: GenerateParams): Promise<string> {
  const { rawInput, patientName, species, breed, age, sex, neutered, ownerName } = params;

  const resolvedDefaults = buildDefaults(sex, neutered);

  const model = genAI.getGenerativeModel({
    model: GENERATE_MODEL,
    systemInstruction: buildSingleCallPrompt(resolvedDefaults, species),
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
    safetySettings: GEMINI_SAFETY_SETTINGS as unknown as SafetySetting[],
  });

  const userMessage =
    `Achados do exame:\n${rawInput}\n\n` +
    `Dados do paciente: ${patientName}, ${species}, ${breed}, ${age}, ` +
    `${sex === "M" ? "Macho" : "Fêmea"}, ${neutered ? "castrado(a)" : "não castrado(a)"}, ` +
    `responsável: ${ownerName}.\n\nGere o laudo completo.`;

  const startedAt = Date.now();
  const raw = await withRetry(async () => {
    const result = await model.generateContentStream(userMessage);
    let text = "";
    let chunks = 0;
    for await (const chunk of result.stream) {
      text += chunk.text();
      chunks += 1;
    }
    const finish = (await result.response).candidates?.[0]?.finishReason;
    if (finish && finish !== "STOP" && finish !== "MAX_TOKENS") {
      throw new Error(`content-filter: geração interrompida (${finish})`);
    }
    logInfo("Gemini stream completed", {
      durationMs: Date.now() - startedAt,
      chunks,
      bytes: text.length,
    });
    return text;
  });

  try {
    JSON.parse(raw.trim());
    return raw.trim();
  } catch {
    return raw;
  }
}
