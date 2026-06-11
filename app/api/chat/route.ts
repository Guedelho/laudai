import { createAgentUIStreamResponse } from "ai";
import { withApiHandler } from "@/lib/api-handler";
import { getProfile } from "@/lib/supabase/profile";
import { createLaudoAgent } from "@/lib/agents/laudo-agent";
import { saveChatMessages } from "@/lib/chat/history";

export const maxDuration = 300;

export const POST = withApiHandler(
  async ({ userId, orgId, admin, audit, req }) => {
    const [profile, { messages }] = await Promise.all([getProfile(admin, userId), req.json()]);
    const persist = req.nextUrl.searchParams.get("persist") === "1";

    const agent = createLaudoAgent({ userId, orgId, admin, audit }, profile?.full_name ?? "");

    return createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      ...(persist && {
        originalMessages: messages,
        onFinish: ({ messages: all }: { messages: unknown[] }) =>
          saveChatMessages(admin, userId, orgId, all as Parameters<typeof saveChatMessages>[3]),
      }),
    });
  },
  { rateLimit: { endpoint: "reports.chat", max: 30, windowSec: 60 } },
);
