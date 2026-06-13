import "server-only";

import type { createAdmin } from "@/lib/supabase/admin";
import {
  TABLES,
  GEMINI_INPUT_PRICE_NANO_USD_PER_TOKEN,
  GEMINI_OUTPUT_PRICE_NANO_USD_PER_TOKEN,
  CHAT_DAILY_BUDGET_NANO_USD,
} from "@/shared/constants";
import { brazilToday } from "@/lib/utils";
import { logError } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

interface DailyChatUsage {
  inputTokens: number;
  outputTokens: number;
}

export function chatUsageCostNanoUsd(inputTokens: number, outputTokens: number): number {
  return inputTokens * GEMINI_INPUT_PRICE_NANO_USD_PER_TOKEN + outputTokens * GEMINI_OUTPUT_PRICE_NANO_USD_PER_TOKEN;
}

async function getDailyChatUsage(admin: Admin, userId: string): Promise<DailyChatUsage> {
  const { data, error } = await admin
    .from(TABLES.chat_token_usage)
    .select("input_tokens, output_tokens")
    .eq("user_id", userId)
    .eq("usage_date", brazilToday())
    .maybeSingle();
  if (error) {
    logError("getDailyChatUsage failed", error, { userId });
    return { inputTokens: 0, outputTokens: 0 };
  }
  return { inputTokens: data?.input_tokens ?? 0, outputTokens: data?.output_tokens ?? 0 };
}

export async function isChatBudgetExceeded(admin: Admin, userId: string): Promise<boolean> {
  const { inputTokens, outputTokens } = await getDailyChatUsage(admin, userId);
  return chatUsageCostNanoUsd(inputTokens, outputTokens) >= CHAT_DAILY_BUDGET_NANO_USD;
}

export async function recordChatUsage(
  admin: Admin,
  userId: string,
  usage: { inputTokens?: number; outputTokens?: number },
): Promise<void> {
  const input = Math.max(0, Math.round(usage.inputTokens ?? 0));
  const output = Math.max(0, Math.round(usage.outputTokens ?? 0));
  if (input === 0 && output === 0) return;
  try {
    const { error } = await admin.rpc("add_chat_token_usage", {
      p_user_id: userId,
      p_usage_date: brazilToday(),
      p_input_tokens: input,
      p_output_tokens: output,
    });
    if (error) logError("recordChatUsage failed", error, { userId });
  } catch (err) {
    logError("recordChatUsage threw", err, { userId });
  }
}
