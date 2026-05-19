import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { ClinicRequest } from "@/shared/interfaces";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const PATCH = withApiHandler<{ id: string }>({}, async ({ userId, admin, audit, params, req }) => {
  const { name }: ClinicRequest = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome da clínica é obrigatório" }, { status: 400 });

  const { data: before } = await admin
    .from(TABLES.clinics)
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "Clínica não encontrada." }, { status: 404 });

  const { data: clinic, error } = await admin
    .from(TABLES.clinics)
    .update({ name: name.trim() })
    .eq("id", params.id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    logError("Clinic update failed", error, { userId, clinicId: params.id });
    return NextResponse.json({ error: "Erro ao atualizar clínica." }, { status: 500 });
  }

  await audit({
    action: AUDIT_ACTIONS.update,
    entityType: AUDIT_ENTITIES.clinic,
    entityId: clinic.id,
    changes: { before, after: clinic },
  });
  return NextResponse.json({ clinic });
});

export const DELETE = withApiHandler<{ id: string }>({}, async ({ userId, admin, audit, params }) => {
  const { data: before } = await admin
    .from(TABLES.clinics)
    .select("*")
    .eq("id", params.id)
    .eq("user_id", userId)
    .maybeSingle();
  if (!before) return NextResponse.json({ error: "Clínica não encontrada." }, { status: 404 });

  const { error } = await admin.from(TABLES.clinics).delete().eq("id", params.id).eq("user_id", userId);

  if (error) {
    logError("Clinic delete failed", error, { userId, clinicId: params.id });
    return NextResponse.json({ error: "Erro ao excluir clínica." }, { status: 500 });
  }
  await audit({
    action: AUDIT_ACTIONS.delete,
    entityType: AUDIT_ENTITIES.clinic,
    entityId: params.id,
    changes: before,
  });
  return NextResponse.json({ ok: true });
});
