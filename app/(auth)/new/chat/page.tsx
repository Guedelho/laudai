import { getUserId, getProfile } from "@/lib/supabase/auth";
import { laudoGreeting } from "@/lib/laudo-greeting";
import InteractiveLaudoChat from "./InteractiveLaudoChat";

export default async function InteractiveLaudoPage() {
  const userId = await getUserId();
  if (!userId) return null;
  const profile = await getProfile(userId);
  return <InteractiveLaudoChat greeting={laudoGreeting(profile?.full_name ?? "")} />;
}
