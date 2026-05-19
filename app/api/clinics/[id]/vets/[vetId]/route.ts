import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const DELETE = withApiHandler<{ id: string; vetId: string }>(
  {},
  async ({ userId, orgId, admin, audit, params }) => {
    const clinicId = params.id;

    const { data: clinic } = await admin
      .from(TABLES.clinics)
      .select("id")
      .eq("id", clinicId)
      .eq("org_id", orgId)
      .single();
    if (!clinic) return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });

    const { data: before } = await admin
      .from(TABLES.clinic_vets)
      .select("*")
      .eq("id", params.vetId)
      .eq("clinic_id", clinicId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!before) return NextResponse.json({ error: "Médico não encontrado." }, { status: 404 });

    const { error } = await admin.from(TABLES.clinic_vets).delete().eq("id", params.vetId).eq("user_id", userId);

    if (error) {
      logError("Clinic vet delete failed", error, { userId, clinicId: params.id, vetId: params.vetId });
      return NextResponse.json({ error: "Erro ao remover médico." }, { status: 500 });
    }
    await audit({
      action: AUDIT_ACTIONS.delete,
      entityType: AUDIT_ENTITIES.clinic_vet,
      entityId: params.vetId,
      changes: before,
    });
    return NextResponse.json({ ok: true });
  },
);
