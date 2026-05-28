import "server-only";

import { createAdmin } from "@/lib/supabase/admin";
import { ORG_ROLES, TABLES } from "@/shared/constants";

type Admin = ReturnType<typeof createAdmin>;

export async function isOrgOwner(admin: Admin, userId: string, orgId: string): Promise<boolean> {
  const { data } = await admin
    .from(TABLES.organization_members)
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === ORG_ROLES.owner;
}
