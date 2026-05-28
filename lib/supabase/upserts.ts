import "server-only";

import { createAdmin } from "@/lib/supabase/admin";
import { TABLES } from "@/shared/constants";

type Admin = ReturnType<typeof createAdmin>;

export async function findOrCreateClient(admin: Admin, userId: string, orgId: string, name: string) {
  const { data: existing } = await admin
    .from(TABLES.clients)
    .select("*, client_vets(*)")
    .eq("org_id", orgId)
    .eq("name", name.trim())
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from(TABLES.clients)
    .insert({ user_id: userId, org_id: orgId, name })
    .select("*, client_vets(*)")
    .single();
  if (error) throw error;
  return data;
}

export async function findOrCreateVet(admin: Admin, clientId: string, userId: string, orgId: string, name: string) {
  const { data: existing } = await admin
    .from(TABLES.client_vets)
    .select("*")
    .eq("client_id", clientId)
    .eq("name", name.trim())
    .maybeSingle();
  if (existing) return existing;

  const { data, error } = await admin
    .from(TABLES.client_vets)
    .insert({ client_id: clientId, user_id: userId, org_id: orgId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
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

export async function resolveOwnedFks(
  admin: Admin,
  orgId: string,
  ids: { petId?: string | null; clientId?: string | null; vetId?: string | null },
): Promise<{ petId: string | null; clientId: string | null; vetId: string | null }> {
  const [pet, client, vet] = await Promise.all([
    ids.petId
      ? admin.from(TABLES.pets).select("id").eq("id", ids.petId).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    ids.clientId
      ? admin.from(TABLES.clients).select("id").eq("id", ids.clientId).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
    ids.vetId
      ? admin.from(TABLES.client_vets).select("id").eq("id", ids.vetId).eq("org_id", orgId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    petId: pet.data?.id ?? null,
    clientId: client.data?.id ?? null,
    vetId: vet.data?.id ?? null,
  };
}
