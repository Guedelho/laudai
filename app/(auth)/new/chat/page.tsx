import { getUserId, getCurrentOrgId } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profile";
import { createAdmin } from "@/lib/supabase/admin";
import { laudoGreeting } from "@/lib/laudo-greeting";
import InteractiveLaudoChat from "./InteractiveLaudoChat";

export default async function InteractiveLaudoPage() {
  const userId = await getUserId();
  if (!userId) return null;
  const admin = createAdmin();
  const [profile, orgId] = await Promise.all([getProfile(admin, userId), getCurrentOrgId(userId)]);
  return <InteractiveLaudoChat greeting={laudoGreeting(profile?.full_name ?? "")} orgId={orgId} />;
}
