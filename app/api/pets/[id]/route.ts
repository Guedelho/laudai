import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, species, breed, age, ownerName, sex, neutered } = await req.json();
  if (!name?.trim() || !species?.trim() || !ownerName?.trim()) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, espécie, tutor" }, { status: 400 });
  }

  const admin = createAdmin();
  const { data: pet, error } = await admin
    .from("pets")
    .update({
      name: name.trim(),
      species: species.trim(),
      breed: breed?.trim() || null,
      age: age?.trim() || null,
      owner_name: ownerName.trim(),
      sex: sex || null,
      neutered: neutered ?? null,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Pet update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar paciente." }, { status: 500 });
  }
  return NextResponse.json({ pet });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { error } = await admin
    .from("pets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Pet delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir paciente." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
