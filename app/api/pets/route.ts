import { NextResponse } from "next/server";
import { findOrCreatePet } from "@/lib/supabase/db";
import { PetRequest } from "@/shared/interfaces";
import { withApiHandler } from "@/lib/api-handler";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const GET = withApiHandler({}, async ({ userId, orgId, admin }) => {
  const { data: pets, error } = await admin
    .from(TABLES.pets)
    .select("*")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    logError("Pets fetch failed", error, { userId, orgId });
    return NextResponse.json({ error: "Erro ao buscar pacientes." }, { status: 500 });
  }
  return NextResponse.json({ pets });
});

export const POST = withApiHandler({}, async ({ userId, orgId, admin, audit, req }) => {
  const { name, species, breed, age, sex, neutered, ownerName }: PetRequest = await req.json();
  if (!name || !species || !ownerName) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, espécie, tutor" }, { status: 400 });
  }

  const pet = await findOrCreatePet(admin, userId, orgId, name.trim(), ownerName.trim(), {
    species,
    breed,
    age,
    sex,
    neutered,
  });
  await audit({ action: AUDIT_ACTIONS.create, entityType: AUDIT_ENTITIES.pet, entityId: pet.id, changes: pet });
  return NextResponse.json({ pet });
});
