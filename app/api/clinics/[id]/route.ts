import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { withApiHandler } from "@/lib/api-handler";
import { ClinicRequest } from "@/shared/interfaces";
import { logError } from "@/lib/log";

export const PATCH = withApiHandler<{ id: string }>({}, async ({ userId, req, params }) => {
  const { name }: ClinicRequest = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome da clínica é obrigatório" }, { status: 400 });

  const admin = createAdmin();
  const { data: clinic, error } = await admin
    .from("clinics")
    .update({ name: name.trim() })
    .eq("id", params.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    logError("Clinic update failed", error, { userId, clinicId: params.id });
    return NextResponse.json({ error: "Erro ao atualizar clínica." }, { status: 500 });
  }
  return NextResponse.json({ clinic });
});

export const DELETE = withApiHandler<{ id: string }>({}, async ({ userId, params }) => {
  const admin = createAdmin();
  const { error } = await admin.from("clinics").delete().eq("id", params.id).eq("user_id", userId);

  if (error) {
    logError("Clinic delete failed", error, { userId, clinicId: params.id });
    return NextResponse.json({ error: "Erro ao excluir clínica." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
});
