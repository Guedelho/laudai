import { GoogleGenerativeAI } from "@google/generative-ai";
import { GENERATE_MODEL } from "@/shared/constants";
import { buildDefaults, buildSingleCallPrompt } from "@/lib/report/templates";
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

export async function generateReport(params: GenerateParams): Promise<string> {
  const { rawInput, patientName, species, breed, age, sex, neutered, ownerName, onStatus, onChunk, signal } = params;

  const resolvedDefaults = buildDefaults(sex, neutered);

  const model = genAI.getGenerativeModel({
    model: GENERATE_MODEL,
    systemInstruction: buildSingleCallPrompt(resolvedDefaults, species),
    generationConfig: { temperature: 0, responseMimeType: "application/json" },
  });

  onStatus?.("generating");

  const userMessage =
    `Achados do exame:\n${rawInput}\n\n` +
    `Dados do paciente: ${patientName}, ${species}, ${breed}, ${age}, ` +
    `${sex === "M" ? "Macho" : "Fêmea"}, ${neutered ? "castrado(a)" : "não castrado(a)"}, ` +
    `responsável: ${ownerName}.\n\nGere o laudo completo.`;

  const raw = await withRetry(
    async () => {
      const result = await model.generateContentStream(userMessage);
      let text = "";
      for await (const chunk of result.stream) {
        if (signal?.aborted) throw new Error("aborted");
        const chunkText = chunk.text();
        text += chunkText;
        onChunk?.(chunkText);
      }
      return text;
    },
    2,
    () => onStatus?.("retrying"),
  );

  try {
    JSON.parse(raw.trim());
    return raw.trim();
  } catch {
    return raw;
  }
}
