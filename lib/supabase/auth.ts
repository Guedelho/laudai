import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
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
