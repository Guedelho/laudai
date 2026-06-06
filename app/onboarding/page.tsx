import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/supabase/profile";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await getServerUser();
  if (!user) redirect("/login");

  const admin = createAdmin();
  if (await getProfile(admin, user.id)) redirect("/dashboard");

  const md = (user.user_metadata ?? {}) as Record<string, string>;
  return <OnboardingForm initialFullName={md.full_name ?? md.name ?? ""} />;
}
