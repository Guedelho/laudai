import { NextResponse } from "next/server";
import { PetRequest } from "@/shared/interfaces";
import { withApiHandler, loadOwned } from "@/lib/api-handler";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

const NOT_FOUND = NextResponse.json({ error: "Paciente não encontrado." }, { status: 404 });

export const PATCH = withApiHandler<{ id: string }>(async ({ userId, admin, audit, params, req }) => {
  const { name, species, breed, age, ownerName, sex, neutered }: PetRequest = await req.json();
  if (!name?.trim() || !species?.trim() || !ownerName?.trim() || !sex?.trim() || typeof neutered !== "boolean") {
    return NextResponse.json(
      { error: "Campos obrigatórios: nome, espécie, tutor, sexo, castrado(a)" },
      { status: 400 },
    );
  }

  const before = await loadOwned(admin, TABLES.pets, params.id, userId);
  if (!before) return NOT_FOUND;

  const { data: pet, error } = await admin
    .from(TABLES.pets)
    .update({
      name: name.trim(),
      species: species.trim(),
      breed: breed.trim(),
      age: age.trim(),
      owner_name: ownerName.trim(),
      sex,
      neutered,
    })
    .eq("id", params.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    logError("Pet update failed", error, { userId, petId: params.id });
    return NextResponse.json({ error: "Erro ao atualizar paciente." }, { status: 500 });
  }

  await audit({
    action: AUDIT_ACTIONS.update,
    entityType: AUDIT_ENTITIES.pet,
    entityId: pet.id,
    changes: { before, after: pet },
  });
  return NextResponse.json({ pet });
});

export const DELETE = withApiHandler<{ id: string }>(async ({ userId, admin, audit, params }) => {
  const before = await loadOwned(admin, TABLES.pets, params.id, userId);
  if (!before) return NOT_FOUND;

  const { error } = await admin.from(TABLES.pets).delete().eq("id", params.id).eq("user_id", userId);

  if (error) {
    logError("Pet delete failed", error, { userId, petId: params.id });
    return NextResponse.json({ error: "Erro ao excluir paciente." }, { status: 500 });
  }
  await audit({ action: AUDIT_ACTIONS.delete, entityType: AUDIT_ENTITIES.pet, entityId: params.id, changes: before });
  return NextResponse.json({ ok: true });
});
