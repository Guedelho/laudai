import { generateText, Output, NoObjectGeneratedError } from "ai";
import { google } from "@ai-sdk/google";
import { GENERATE_MODEL, GEMINI_SAFETY_SETTINGS } from "@/shared/constants";
import { buildDefaults, buildSingleCallPrompt } from "@/lib/report/templates";
import { logInfo, logWarn } from "@/lib/log";
import type { GenerateParams } from "@/shared/interfaces";

// Transient API errors (429/500/503) are retried inside generateText itself.
// NoObjectGeneratedError covers a filtered finish, MAX_TOKENS truncation and
// malformed JSON — all deterministic at temperature 0, so retries re-roll
// with temperature + a fresh seed (same strategy as the chat middleware).
const MAX_ATTEMPTS = 3;
const RETRY_TEMPERATURE = 0.7;
const BASE_SEED = 42;

export async function generateReport(params: GenerateParams): Promise<string> {
  const { rawInput, patientName, species, breed, age, sex, neutered, ownerName } = params;

  const resolvedDefaults = buildDefaults(sex, neutered);
  const system = buildSingleCallPrompt(resolvedDefaults, species);

  const userMessage =
    `Achados do exame:\n${rawInput}\n\n` +
    `Dados do paciente: ${patientName}, ${species}, ${breed}, ${age}, ` +
    `${sex === "M" ? "Macho" : "Fêmea"}, ${neutered ? "castrado(a)" : "não castrado(a)"}, ` +
    `responsável: ${ownerName}.\n\nGere o laudo completo.`;

  const startedAt = Date.now();
  for (let attempt = 1; ; attempt++) {
    try {
      const result = await generateText({
        model: google(GENERATE_MODEL),
        output: Output.json(),
        system,
        prompt: userMessage,
        temperature: attempt === 1 ? 0 : RETRY_TEMPERATURE,
        seed: attempt === 1 ? undefined : BASE_SEED + attempt,
        providerOptions: {
          google: {
            safetySettings: [...GEMINI_SAFETY_SETTINGS],
            thinkingConfig: { thinkingLevel: "low" },
          },
        },
      });
      logInfo("Gemini generation completed", {
        durationMs: Date.now() - startedAt,
        attempt,
        inputTokens: result.usage.inputTokens,
        outputTokens: result.usage.outputTokens,
      });
      return JSON.stringify(result.output);
    } catch (err) {
      if (!NoObjectGeneratedError.isInstance(err)) throw err;
      if (attempt >= MAX_ATTEMPTS) {
        throw new Error("A geração do laudo foi interrompida. Tente novamente.", { cause: err });
      }
      logWarn("Gemini retry", {
        attempt,
        maxAttempts: MAX_ATTEMPTS,
        finishReason: err.finishReason,
        error: err.message,
      });
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}
