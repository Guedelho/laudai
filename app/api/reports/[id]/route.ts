import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { reportCacheTag } from "@/lib/utils";
import { createAdmin } from "@/lib/supabase/admin";
import { UpdateReportRequest } from "@/shared/interfaces";
import { withApiHandler } from "@/lib/api-handler";
import { resolveOwnedFks } from "@/lib/supabase/db";
import { logError } from "@/lib/log";

export const PATCH = withApiHandler<{ id: string }>({}, async ({ userId, req, params }) => {
  const id = params.id;
  const admin = createAdmin();

  const { generatedContent, patientFields, petId, clinicId, vetId }: UpdateReportRequest = await req.json();
  const owned = await resolveOwnedFks(admin, userId, { petId, clinicId, vetId });

  const { error } = await admin
    .from("reports")
    .update({
      edited_content: JSON.stringify(generatedContent),
      ...patientFields,
      pdf_storage_path: null,
      ...(petId !== undefined ? { pet_id: owned.petId } : {}),
      ...(clinicId !== undefined ? { clinic_id: owned.clinicId } : {}),
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
          .from("pets")
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
          .eq("user_id", userId),
      owned.clinicId &&
        admin
          .from("clinics")
          .update({ name: patientFields.clinic_name })
          .eq("id", owned.clinicId)
          .eq("user_id", userId),
      owned.vetId &&
        admin
          .from("clinic_vets")
          .update({ name: patientFields.responsible_vet })
          .eq("id", owned.vetId)
          .eq("user_id", userId),
    ].filter(Boolean),
  );

  revalidateTag(reportCacheTag(id), "max");
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiHandler<{ id: string }>({}, async ({ userId, params }) => {
  const id = params.id;
  const admin = createAdmin();

  const { error } = await admin
    .from("reports")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    logError("Report delete failed", error, { userId, reportId: id });
    return NextResponse.json({ error: "Erro ao excluir laudo." }, { status: 500 });
  }

  revalidateTag(reportCacheTag(id), "max");
  revalidatePath("/dashboard");
  return NextResponse.json({ ok: true });
});
