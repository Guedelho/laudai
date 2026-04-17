import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { findOrCreateVet } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clinicId } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const admin = createAdmin();

  const { data: clinic } = await admin
    .from("clinics")
    .select("id")
    .eq("id", clinicId)
    .eq("user_id", userId)
    .single();
  if (!clinic) return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });

  try {
    const vet = await findOrCreateVet(admin, clinicId, userId, name.trim());
    return NextResponse.json({ vet });
  } catch (err) {
    console.error("Clinic vet add error:", err);
    return NextResponse.json({ error: "Erro ao adicionar médico." }, { status: 500 });
  }
}
