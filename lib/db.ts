import { createAdmin } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdmin>;

export async function findOrCreateClinic(admin: Admin, userId: string, name: string) {
  const { data: existing } = await admin
    .from("clinics")
    .select("*, clinic_vets(*)")
    .eq("user_id", userId)
    .ilike("name", name)
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
    .ilike("name", name)
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

export async function findOrCreatePet(
  admin: Admin,
  userId: string,
  name: string,
  ownerName: string,
  fields?: { species?: string; breed?: string | null; age?: string | null; sex: string; neutered: boolean }
) {
  const { data: existing } = await admin
    .from("pets")
    .select("*")
    .eq("user_id", userId)
    .ilike("name", name)
    .ilike("owner_name", ownerName)
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
