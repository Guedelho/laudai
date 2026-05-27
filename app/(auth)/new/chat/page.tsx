import { getUserId, getProfile, getCurrentOrgId } from "@/lib/supabase/auth";
import { laudoGreeting } from "@/lib/laudo-greeting";
import InteractiveLaudoChat from "./InteractiveLaudoChat";

export default async function InteractiveLaudoPage() {
  const userId = await getUserId();
  if (!userId) return null;
  const [profile, orgId] = await Promise.all([getProfile(userId), getCurrentOrgId(userId)]);
  return <InteractiveLaudoChat greeting={laudoGreeting(profile?.full_name ?? "")} orgId={orgId} />;
}
