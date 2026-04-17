import { NextRequest } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { Profile } from "@/shared";

export async function getUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const admin = createAdmin();
    const {
      data: { user },
    } = await admin.auth.getUser(authHeader.slice(7));
    if (user?.id) return user.id;
  }
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
