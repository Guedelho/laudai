import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";

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

  // Verify clinic belongs to user
  const { data: clinic } = await admin
    .from("clinics")
    .select("id")
    .eq("id", clinicId)
    .eq("user_id", userId)
    .single();
  if (!clinic) return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });

  const { data: vet, error } = await admin
    .from("clinic_vets")
    .insert({ clinic_id: clinicId, user_id: userId, name: name.trim() })
    .select()
    .single();

  if (error) {
    console.error("Clinic vet add error:", error);
    return NextResponse.json({ error: "Erro ao adicionar médico." }, { status: 500 });
  }
  return NextResponse.json({ vet });
}
