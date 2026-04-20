import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome da clínica é obrigatório" }, { status: 400 });

  const admin = createAdmin();
  const { data: clinic, error } = await admin
    .from("clinics")
    .update({ name: name.trim() })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Clinic update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar clínica." }, { status: 500 });
  }
  return NextResponse.json({ clinic });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { error } = await admin.from("clinics").delete().eq("id", id).eq("user_id", userId);

  if (error) {
    console.error("Clinic delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir clínica." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
