import { cache } from "react";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { TABLES, ORG_ROLES } from "@/shared/constants";

// cache() dedupes per request: the layout, page, and nested server components
// share one Supabase Auth round-trip instead of each firing its own.
export const getServerUser = cache(async () => {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function getUserId(): Promise<string | null> {
  return (await getServerUser())?.id ?? null;
}

export const getCurrentOrgId = cache(async (userId: string): Promise<string> => {
  const admin = createAdmin();
  const { data } = await admin.from(TABLES.organization_members).select("org_id, role").eq("user_id", userId);

  if (!data || data.length === 0) {
    throw new Error(`No organization for user ${userId}`);
  }

  const owned = data.find((m) => m.role === ORG_ROLES.owner);
  return (owned ?? data[0]).org_id;
});
