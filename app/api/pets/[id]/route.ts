import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { PetRequest } from "@/shared/interfaces";
import { withApiHandler } from "@/lib/api-handler";

export const PATCH = withApiHandler<{ id: string }>({}, async ({ userId, req, params }) => {
  const { name, species, breed, age, ownerName, sex, neutered }: PetRequest = await req.json();
  if (!name?.trim() || !species?.trim() || !ownerName?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, espécie, tutor" }, { status: 400 });
  }

  const admin = createAdmin();
  const { data: pet, error } = await admin
    .from("pets")
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
    console.error("Pet update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar paciente." }, { status: 500 });
  }
  return NextResponse.json({ pet });
});

export const DELETE = withApiHandler<{ id: string }>({}, async ({ userId, params }) => {
  const admin = createAdmin();
  const { error } = await admin.from("pets").delete().eq("id", params.id).eq("user_id", userId);

  if (error) {
    console.error("Pet delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir paciente." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
