import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { reportCacheTag } from "@/lib/utils";
import { UpdateReportRequest } from "@/shared/interfaces";
import { withApiHandler } from "@/lib/api-handler";
import { resolveOwnedFks } from "@/lib/supabase/db";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const PATCH = withApiHandler<{ id: string }>(async ({ userId, orgId, admin, audit, params, req }) => {
  const id = params.id;
  const { generatedContent, patientFields, petId, clientId, vetId }: UpdateReportRequest = await req.json();
  const owned = await resolveOwnedFks(admin, orgId, { petId, clientId, vetId });

  const editedContent = JSON.stringify(generatedContent);

  const { data: latestVersion } = await admin
    .from(TABLES.report_versions)
    .select("version")
    .eq("report_id", id)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextVersion = (latestVersion?.version ?? 0) + 1;

  const { error: versionError } = await admin
    .from(TABLES.report_versions)
    .insert({ report_id: id, edited_by: userId, content: editedContent, version: nextVersion });

  if (versionError) {
    logError("Report version insert failed", versionError, { userId, reportId: id });
    return NextResponse.json({ error: "Erro ao salvar laudo." }, { status: 500 });
  }

  const { error } = await admin
    .from(TABLES.reports)
    .update({
      edited_content: editedContent,
      updated_by: userId,
      ...patientFields,
      pdf_storage_path: null,
      ...(petId !== undefined ? { pet_id: owned.petId } : {}),
      ...(clientId !== undefined ? { client_id: owned.clientId } : {}),
      ...(vetId !== undefined ? { vet_id: owned.vetId } : {}),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    logError("Report update failed", error, { userId, reportId: id });
    return NextResponse.json({ error: "Erro ao salvar laudo." }, { status: 500 });
  }

  await Promise.all(
    [
      owned.petId &&
        admin
          .from(TABLES.pets)
          .update({
            name: patientFields.patient_name,
            species: patientFields.species,
            breed: patientFields.breed,
            age: patientFields.age,
            sex: patientFields.sex,
            neutered: patientFields.neutered,
            owner_name: patientFields.owner_name,
          })
          .eq("id", owned.petId)
          .eq("org_id", orgId),
      owned.clientId &&
        admin
          .from(TABLES.clients)
          .update({ name: patientFields.client_name })
          .eq("id", owned.clientId)
          .eq("org_id", orgId),
      owned.vetId &&
        admin
          .from(TABLES.client_vets)
          .update({ name: patientFields.responsible_vet })
          .eq("id", owned.vetId)
          .eq("org_id", orgId),
    ].filter(Boolean),
  );

  revalidateTag(reportCacheTag(id), "max");
  revalidatePath("/dashboard");
  await audit({
    action: AUDIT_ACTIONS.update,
    entityType: AUDIT_ENTITIES.report,
    entityId: id,
    changes: { patientFields, version: nextVersion },
  });
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiHandler<{ id: string }>(async ({ userId, admin, audit, params }) => {
  const id = params.id;
  const { error } = await admin
    .from(TABLES.reports)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    logError("Report delete failed", error, { userId, reportId: id });
    return NextResponse.json({ error: "Erro ao excluir laudo." }, { status: 500 });
  }

  revalidateTag(reportCacheTag(id), "max");
  revalidatePath("/dashboard");
  await audit({ action: AUDIT_ACTIONS.delete, entityType: AUDIT_ENTITIES.report, entityId: id });
  return NextResponse.json({ ok: true });
});
