import "server-only";

import { createAdmin } from "@/lib/supabase/admin";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

export async function invalidateUserPdfCache(admin: Admin, userId: string): Promise<void> {
  const { error } = await admin.from(TABLES.reports).update({ pdf_storage_path: null }).eq("user_id", userId);
  if (error) logError("PDF cache invalidation failed", error, { userId });
}

export async function invalidateOrgPdfCache(admin: Admin, orgId: string): Promise<void> {
  const { error } = await admin.from(TABLES.reports).update({ pdf_storage_path: null }).eq("org_id", orgId);
  if (error) logError("Org PDF cache invalidation failed", error, { orgId });
}
