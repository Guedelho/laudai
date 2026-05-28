import { createAgentUIStreamResponse } from "ai";
import { withApiHandler } from "@/lib/api-handler";
import { getProfile } from "@/lib/supabase/profile";
import { createLaudoAgent } from "@/lib/agents/laudo-agent";

export const maxDuration = 300;

export const POST = withApiHandler(
  async ({ userId, orgId, admin, audit, req }) => {
    const [profile, { messages }] = await Promise.all([getProfile(admin, userId), req.json()]);

    const agent = createLaudoAgent({ userId, orgId, admin, audit }, profile?.full_name ?? "");

    return createAgentUIStreamResponse({ agent, uiMessages: messages });
  },
  { rateLimit: { endpoint: "reports.chat", max: 30, windowSec: 60 } },
);
