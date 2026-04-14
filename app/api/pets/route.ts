import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdmin();

  const { data: pets, error } = await supabase
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

  const supabase = createAdmin();

  const { name, species, breed, age, ownerName } = await req.json();

  if (!name || !species || !ownerName) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, espécie, tutor" }, { status: 400 });
  }

  const { data: pet, error } = await supabase
    .from("pets")
    .insert({ user_id: userId, name, species, breed: breed || null, age: age || null, owner_name: ownerName })
    .select()
    .single();

  if (error) {
    console.error("Pet create error:", error);
    return NextResponse.json({ error: "Erro ao criar paciente." }, { status: 500 });
  }

  return NextResponse.json({ pet });
}
