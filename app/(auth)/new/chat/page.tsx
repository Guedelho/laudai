import { getUserId, getCurrentOrgId } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profile";
import { createAdmin } from "@/lib/supabase/admin";
import { laudoGreeting } from "@/lib/laudo-greeting";
import { loadRecentSession } from "@/lib/chat/history";
import { TABLES } from "@/shared/constants";
import type { LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";
import InteractiveLaudoChat from "./InteractiveLaudoChat";

const START_LAUDO_MESSAGE = "Quero gerar um laudo de ultrassom abdominal.";

export default async function InteractiveLaudoPage({
  searchParams,
}: {
  searchParams: Promise<{ laudo?: string; report?: string }>;
}) {
  const userId = await getUserId();
  if (!userId) return null;
  const { laudo, report } = await searchParams;
  const admin = createAdmin();
  const [profile, orgId, session] = await Promise.all([
    getProfile(admin, userId),
    getCurrentOrgId(userId),
    loadRecentSession(admin, userId),
  ]);

  let autoStartMessage: string | null = null;
  if (laudo === "1") {
    autoStartMessage = START_LAUDO_MESSAGE;
  } else if (report) {
    const { data } = await admin
      .from(TABLES.reports)
      .select("id, patient_name")
      .eq("org_id", orgId)
      .eq("id", report)
      .is("deleted_at", null)
      .maybeSingle();
    if (data) autoStartMessage = `Quero discutir o laudo do paciente ${data.patient_name} (id ${data.id}).`;
  }

  const fresh = autoStartMessage !== null;
  return (
    <InteractiveLaudoChat
      greeting={laudoGreeting(profile?.full_name ?? "")}
      orgId={orgId}
      initialMessages={(fresh ? [] : session.messages) as unknown as LaudoAgentUIMessage[]}
      historyCursor={fresh ? (session.latestSeq !== null ? session.latestSeq + 1 : null) : session.cursor}
      hasHistory={fresh ? session.latestSeq !== null : session.hasHistory}
      autoStartMessage={autoStartMessage}
    />
  );
}
