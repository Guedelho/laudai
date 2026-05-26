import { createAdmin } from "@/lib/supabase/admin";
import { ORG_ROLES, TABLES, type ReportType } from "@/shared/constants";
import { logError } from "@/lib/log";

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

export async function findOrCreateClinic(admin: Admin, userId: string, orgId: string, name: string) {
  const { data: existing } = await admin
    .from(TABLES.clinics)
    .select("*, clinic_vets(*)")
    .eq("org_id", orgId)
    .eq("name", name.trim())
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from(TABLES.clinics)
    .insert({ user_id: userId, org_id: orgId, name })
    .select("*, clinic_vets(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function findOrCreateVet(admin: Admin, clinicId: string, userId: string, orgId: string, name: string) {
  const { data: existing } = await admin
    .from(TABLES.clinic_vets)
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("name", name.trim())
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from(TABLES.clinic_vets)
    .insert({ clinic_id: clinicId, user_id: userId, org_id: orgId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function invalidateUserPdfCache(admin: Admin, userId: string): Promise<void> {
  const { error } = await admin.from(TABLES.reports).update({ pdf_storage_path: null }).eq("user_id", userId);
  if (error) logError("PDF cache invalidation failed", error, { userId });
}

export async function invalidateOrgPdfCache(admin: Admin, orgId: string): Promise<void> {
  const { error } = await admin.from(TABLES.reports).update({ pdf_storage_path: null }).eq("org_id", orgId);
  if (error) logError("Org PDF cache invalidation failed", error, { orgId });
}

export async function isOrgOwner(admin: Admin, userId: string, orgId: string): Promise<boolean> {
  const { data } = await admin
    .from(TABLES.organization_members)
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return data?.role === "owner";
}

export async function resolveOwnedFks(
  admin: Admin,
  orgId: string,
  ids: { petId?: string | null; clinicId?: string | null; vetId?: string | null },
): Promise<{ petId: string | null; clinicId: string | null; vetId: string | null }> {
  const [pet, clinic, vet] = await Promise.all([
    ids.petId
      ? admin.from(TABLES.pets).select("id").eq("id", ids.petId).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    ids.clinicId
      ? admin.from(TABLES.clinics).select("id").eq("id", ids.clinicId).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    ids.vetId
      ? admin.from(TABLES.clinic_vets).select("id").eq("id", ids.vetId).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    petId: pet.data?.id ?? null,
    clinicId: clinic.data?.id ?? null,
    vetId: vet.data?.id ?? null,
  };
}

export async function findOrCreatePet(
  admin: Admin,
  userId: string,
  orgId: string,
  name: string,
  ownerName: string,
  fields: { species: string; breed: string; age: string; sex: string; neutered: boolean },
) {
  const { data: existing } = await admin
    .from(TABLES.pets)
    .select("*")
    .eq("org_id", orgId)
    .eq("name", name.trim())
    .eq("owner_name", ownerName.trim())
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from(TABLES.pets)
    .insert({ user_id: userId, org_id: orgId, name, owner_name: ownerName, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}
