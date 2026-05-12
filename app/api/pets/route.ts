import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { findOrCreatePet } from "@/lib/supabase/db";
import { PetRequest } from "@/shared/interfaces";
import { withApiHandler } from "@/lib/api-handler";
import { logError } from "@/lib/log";

export const GET = withApiHandler({}, async ({ userId }) => {
  const admin = createAdmin();
  const { data: pets, error } = await admin
    .from("pets")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    logError("Pets fetch failed", error, { userId });
    return NextResponse.json({ error: "Erro ao buscar pacientes." }, { status: 500 });
  }
  return NextResponse.json({ pets });
});

export const POST = withApiHandler({}, async ({ userId, req }) => {
  const { name, species, breed, age, sex, neutered, ownerName }: PetRequest = await req.json();
  if (!name || !species || !ownerName) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, espécie, tutor" }, { status: 400 });
  }

  const admin = createAdmin();
  const pet = await findOrCreatePet(admin, userId, name.trim(), ownerName.trim(), {
    species,
    breed,
    age,
    sex,
    neutered,
  });
  return NextResponse.json({ pet });
});
