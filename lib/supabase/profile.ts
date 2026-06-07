import "server-only";

import { createAdmin } from "@/lib/supabase/admin";
import { TABLES } from "@/shared/constants";
import { Profile } from "@/shared/models";

type Admin = ReturnType<typeof createAdmin>;

export async function getProfile(admin: Admin, userId: string): Promise<Profile | null> {
  const { data } = await admin.from(TABLES.profiles).select("*").eq("id", userId).maybeSingle();
  return (data as Profile | null) ?? null;
}
