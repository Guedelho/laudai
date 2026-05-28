import "server-only";

import { createAdmin } from "@/lib/supabase/admin";
import { ORG_ROLES, TABLES, type ReportType } from "@/shared/constants";

type Admin = ReturnType<typeof createAdmin>;

export async function hasReportTypeAccess(admin: Admin, orgId: string, reportType: ReportType): Promise<boolean> {
  const { data } = await admin
    .from(TABLES.organization_report_types)
    .select("report_type_id, expires_at")
    .eq("org_id", orgId)
    .eq("report_type_id", reportType)
    .maybeSingle();
  if (!data) return false;
  if (data.expires_at && new Date(data.expires_at) <= new Date()) return false;
  return true;
}

export async function canWriteReport(
  admin: Admin,
  orgId: string,
  userId: string,
  reportType: ReportType,
): Promise<boolean> {
  const { data: membership } = await admin
    .from(TABLES.organization_members)
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!membership) return false;
  if (membership.role === ORG_ROLES.owner) return true;

  const { data: grant } = await admin
    .from(TABLES.member_specialties)
    .select("report_type_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("report_type_id", reportType)
    .maybeSingle();
  return !!grant;
}
