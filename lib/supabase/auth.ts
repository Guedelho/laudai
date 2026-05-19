import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { TABLES } from "@/shared/constants";
import { Profile } from "@/shared/models";

export async function getUserId(): Promise<string | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const admin = createAdmin();
  const { data } = await admin.from("profiles").select("*").eq("id", userId).single();
  return data ?? null;
}

export async function getCurrentOrgId(userId: string): Promise<string> {
  const admin = createAdmin();
  const { data } = await admin.from(TABLES.organization_members).select("org_id, role").eq("user_id", userId);

  if (!data || data.length === 0) {
    throw new Error(`No organization for user ${userId}`);
  }

  const owned = data.find((m) => m.role === "owner");
  return (owned ?? data[0]).org_id;
}
