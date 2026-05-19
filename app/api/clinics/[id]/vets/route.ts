import { NextResponse } from "next/server";
import { findOrCreateVet } from "@/lib/supabase/db";
import { withApiHandler } from "@/lib/api-handler";
import { ClinicVetRequest } from "@/shared/interfaces";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";

export const POST = withApiHandler<{ id: string }>({}, async ({ userId, orgId, admin, audit, params, req }) => {
  const clinicId = params.id;
  const { name }: ClinicVetRequest = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const { data: clinic } = await admin
    .from(TABLES.clinics)
    .select("id")
    .eq("id", clinicId)
    .eq("org_id", orgId)
    .single();
  if (!clinic) return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });

  const vet = await findOrCreateVet(admin, clinicId, userId, orgId, name.trim());
  await audit({ action: AUDIT_ACTIONS.create, entityType: AUDIT_ENTITIES.clinic_vet, entityId: vet.id, changes: vet });
  return NextResponse.json({ vet });
});
