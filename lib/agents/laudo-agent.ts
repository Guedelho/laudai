import { ToolLoopAgent, stepCountIs, type InferAgentUIMessage } from "ai";
import { google } from "@ai-sdk/google";
import { GENERATE_MODEL } from "@/shared/constants";
import { createLaudoTools, type LaudoToolCtx } from "@/lib/tools/laudo-tools";
import { buildLaudoAgentInstructions } from "@/lib/report/templates";

export function createLaudoAgent(ctx: LaudoToolCtx, vetName: string) {
  return new ToolLoopAgent({
    model: google(GENERATE_MODEL),
    instructions: buildLaudoAgentInstructions(vetName),
    tools: createLaudoTools(ctx),
    stopWhen: stepCountIs(20),
    maxOutputTokens: 2048,
  });
}

export type LaudoAgentUIMessage = InferAgentUIMessage<ReturnType<typeof createLaudoAgent>>;
