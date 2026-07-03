import { NextResponse } from "next/server";
import { createAgentUIStreamResponse } from "ai";
import { withApiHandler } from "@/lib/api-handler";
import { getProfile } from "@/lib/supabase/profile";
import { createLaudoAgent, type LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";
import { saveChatMessages } from "@/lib/chat/history";
import { isChatBudgetExceeded } from "@/lib/chat/usage";
import { CHAT_BUDGET_EXCEEDED_MESSAGE, MAX_CHAT_REQUEST_MESSAGES } from "@/shared/constants";

export const maxDuration = 300;

function isUIMessageArray(value: unknown): value is { role: string; parts: unknown[] }[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_CHAT_REQUEST_MESSAGES &&
    value.every((m) => !!m && typeof m === "object" && "role" in m && Array.isArray((m as { parts?: unknown }).parts))
  );
}

export const POST = withApiHandler(
  async ({ userId, orgId, admin, audit, req }) => {
    const [budgetExceeded, profile, body] = await Promise.all([
      isChatBudgetExceeded(admin, userId),
      getProfile(admin, userId),
      req.json().catch(() => null),
    ]);

    if (budgetExceeded) {
      return NextResponse.json({ error: CHAT_BUDGET_EXCEEDED_MESSAGE }, { status: 429 });
    }

    const rawMessages = (body as { messages?: unknown } | null)?.messages;
    if (!isUIMessageArray(rawMessages)) {
      return NextResponse.json({ error: "Mensagens inválidas." }, { status: 400 });
    }
    const messages = rawMessages as LaudoAgentUIMessage[];

    const agent = createLaudoAgent({ userId, orgId, admin, audit }, profile?.full_name ?? "");

    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      originalMessages: messages,
      generateMessageId: () => crypto.randomUUID(),
      onFinish: ({ messages: all }: { messages: unknown[] }) =>
        saveChatMessages(admin, userId, orgId, all as Parameters<typeof saveChatMessages>[3]),
    });
  },
  { rateLimit: { endpoint: "reports.chat", max: 30, windowSec: 60 } },
);
