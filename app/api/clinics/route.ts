import { NextResponse } from "next/server";
import { findOrCreateClinic, findOrCreateVet } from "@/lib/supabase/db";
import { withApiHandler } from "@/lib/api-handler";
import { ClinicRequest } from "@/shared/interfaces";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const GET = withApiHandler({}, async ({ userId, orgId, admin }) => {
  const { data: clinics, error } = await admin
    .from(TABLES.clinics)
    .select("*, clinic_vets(*)")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (error) {
    logError("Clinics fetch failed", error, { userId, orgId });
    return NextResponse.json({ error: "Erro ao buscar clínicas." }, { status: 500 });
  }
  return NextResponse.json({ clinics });
});

export const POST = withApiHandler({}, async ({ userId, orgId, admin, audit, req }) => {
  const { name, vetName }: ClinicRequest = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome da clínica é obrigatório" }, { status: 400 });

  const clinic = await findOrCreateClinic(admin, userId, orgId, name.trim());
  await audit({
    action: AUDIT_ACTIONS.create,
    entityType: AUDIT_ENTITIES.clinic,
    entityId: clinic.id,
    changes: clinic,
  });

  let vet = null;
  if (vetName?.trim()) {
    vet = await findOrCreateVet(admin, clinic.id, userId, orgId, vetName.trim());
    await audit({
      action: AUDIT_ACTIONS.create,
      entityType: AUDIT_ENTITIES.clinic_vet,
      entityId: vet.id,
      changes: vet,
    });
  }

  return NextResponse.json({ clinic: { ...clinic, clinic_vets: vet ? [vet] : clinic.clinic_vets } });
});
