import { createAdmin } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdmin>;

export async function findOrCreateClinic(admin: Admin, userId: string, name: string) {
  const { data: existing } = await admin
    .from("clinics")
    .select("*, clinic_vets(*)")
    .eq("user_id", userId)
    .eq("name", name.trim())
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from("clinics")
    .insert({ user_id: userId, name })
    .select("*, clinic_vets(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function findOrCreateVet(admin: Admin, clinicId: string, userId: string, name: string) {
  const { data: existing } = await admin
    .from("clinic_vets")
    .select("*")
    .eq("clinic_id", clinicId)
    .eq("name", name.trim())
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from("clinic_vets")
    .insert({ clinic_id: clinicId, user_id: userId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/**
 * Drop cached PDFs for every report owned by this user. Call after the user
 * changes any field that the PDF embeds (logo, signature, name, CRMV).
 */
export async function invalidateUserPdfCache(admin: Admin, userId: string): Promise<void> {
  const { error } = await admin.from("reports").update({ pdf_storage_path: null }).eq("user_id", userId);
  if (error) console.error("PDF cache invalidation error:", error);
}

/**
 * Resolve incoming FK ids to ones that actually belong to this user.
 * Any id that fails the ownership check returns null instead of being persisted.
 */
export async function resolveOwnedFks(
  admin: Admin,
  userId: string,
  ids: { petId?: string | null; clinicId?: string | null; vetId?: string | null },
): Promise<{ petId: string | null; clinicId: string | null; vetId: string | null }> {
  const [pet, clinic, vet] = await Promise.all([
    ids.petId
      ? admin.from("pets").select("id").eq("id", ids.petId).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
    ids.clinicId
      ? admin.from("clinics").select("id").eq("id", ids.clinicId).eq("user_id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
    ids.vetId
      ? admin.from("clinic_vets").select("id").eq("id", ids.vetId).eq("user_id", userId).maybeSingle()
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
  name: string,
  ownerName: string,
  fields: { species: string; breed: string; age: string; sex: string; neutered: boolean },
) {
  const { data: existing } = await admin
    .from("pets")
    .select("*")
    .eq("user_id", userId)
    .eq("name", name.trim())
    .eq("owner_name", ownerName.trim())
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from("pets")
    .insert({ user_id: userId, name, owner_name: ownerName, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}
