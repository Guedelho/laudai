import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { findOrCreatePet } from "@/lib/db";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();
  const { data: pets, error } = await admin
    .from("pets")
    .select("*")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Pets fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar pacientes." }, { status: 500 });
  }
  return NextResponse.json({ pets });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, species, breed, age, ownerName } = await req.json();
  if (!name || !species || !ownerName) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, espécie, tutor" }, { status: 400 });
  }

  const admin = createAdmin();
  try {
    const pet = await findOrCreatePet(admin, userId, name.trim(), ownerName.trim(), {
      species,
      breed: breed || null,
      age: age || null,
    });
    return NextResponse.json({ pet });
  } catch (err) {
    console.error("Pet create error:", err);
    return NextResponse.json({ error: "Erro ao criar paciente." }, { status: 500 });
  }
}
