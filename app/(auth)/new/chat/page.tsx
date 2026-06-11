import { getUserId, getCurrentOrgId } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profile";
import { createAdmin } from "@/lib/supabase/admin";
import { laudoGreeting } from "@/lib/laudo-greeting";
import { loadChatMessages } from "@/lib/chat/history";
import type { LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";
import InteractiveLaudoChat from "./InteractiveLaudoChat";

export default async function InteractiveLaudoPage({ searchParams }: { searchParams: Promise<{ laudo?: string }> }) {
  const userId = await getUserId();
  if (!userId) return null;
  const { laudo } = await searchParams;
  const laudoMode = laudo === "1";
  const admin = createAdmin();
  const [profile, orgId, history] = await Promise.all([
    getProfile(admin, userId),
    getCurrentOrgId(userId),
    laudoMode ? Promise.resolve([]) : loadChatMessages(admin, userId),
  ]);
  return (
    <InteractiveLaudoChat
      greeting={laudoGreeting(profile?.full_name ?? "")}
      orgId={orgId}
      initialMessages={history as unknown as LaudoAgentUIMessage[]}
    />
  );
}
