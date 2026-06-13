import { NextResponse } from "next/server";
import { createAgentUIStreamResponse } from "ai";
import { withApiHandler } from "@/lib/api-handler";
import { getProfile } from "@/lib/supabase/profile";
import { createLaudoAgent } from "@/lib/agents/laudo-agent";
import { saveChatMessages } from "@/lib/chat/history";
import { isChatBudgetExceeded } from "@/lib/chat/usage";
import { CHAT_BUDGET_EXCEEDED_MESSAGE } from "@/shared/constants";

export const maxDuration = 300;

export const POST = withApiHandler(
  async ({ userId, orgId, admin, audit, req }) => {
    if (await isChatBudgetExceeded(admin, userId)) {
      return NextResponse.json({ error: CHAT_BUDGET_EXCEEDED_MESSAGE }, { status: 429 });
    }

    const [profile, { messages }] = await Promise.all([getProfile(admin, userId), req.json()]);

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
