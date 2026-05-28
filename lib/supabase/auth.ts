import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { TABLES, ORG_ROLES } from "@/shared/constants";

export async function getUserId(): Promise<string | null> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function getServerUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentOrgId(userId: string): Promise<string> {
  const admin = createAdmin();
  const { data } = await admin.from(TABLES.organization_members).select("org_id, role").eq("user_id", userId);

  if (!data || data.length === 0) {
    throw new Error(`No organization for user ${userId}`);
  }

  const owned = data.find((m) => m.role === ORG_ROLES.owner);
  return (owned ?? data[0]).org_id;
}
