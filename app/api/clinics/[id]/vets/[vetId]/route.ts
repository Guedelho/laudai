import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; vetId: string }> }) {
  const { id: clinicId, vetId } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { data: clinic } = await admin.from("clinics").select("id").eq("id", clinicId).eq("user_id", userId).single();
  if (!clinic) return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });

  const { error } = await admin.from("clinic_vets").delete().eq("id", vetId).eq("clinic_id", clinicId);

  if (error) {
    console.error("Clinic vet delete error:", error);
    return NextResponse.json({ error: "Erro ao remover médico." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
