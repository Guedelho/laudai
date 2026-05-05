import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { withApiHandler } from "@/lib/api-handler";

export const DELETE = withApiHandler<{ id: string; vetId: string }>({}, async ({ userId, params }) => {
  const clinicId = params.id;
  const admin = createAdmin();

  const { data: clinic } = await admin.from("clinics").select("id").eq("id", clinicId).eq("user_id", userId).single();
  if (!clinic) return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });

  const { error } = await admin.from("clinic_vets").delete().eq("id", params.vetId).eq("clinic_id", clinicId);

  if (error) {
    console.error("Clinic vet delete error:", error);
    return NextResponse.json({ error: "Erro ao remover médico." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
