import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getUserId } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { UpdateReportRequest } from "@/shared/interfaces";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { data: existing } = await admin
    .from("reports")
    .select("locked_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!existing) return NextResponse.json({ error: "Laudo não encontrado." }, { status: 404 });
  if (existing.locked_at)
    return NextResponse.json({ error: "Laudo bloqueado e não pode ser editado." }, { status: 403 });

  const { generatedContent, patientFields, petId, clinicId, vetId }: UpdateReportRequest = await req.json();

  const { error } = await admin
    .from("reports")
    .update({
      edited_content: JSON.stringify(generatedContent),
      ...patientFields,
      pdf_storage_path: null,
      ...(petId !== undefined ? { pet_id: petId } : {}),
      ...(clinicId !== undefined ? { clinic_id: clinicId } : {}),
      ...(vetId !== undefined ? { vet_id: vetId } : {}),
    })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Report update error:", error);
    return NextResponse.json({ error: "Erro ao salvar laudo." }, { status: 500 });
  }

  await Promise.all(
    [
      petId &&
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
          .eq("id", petId)
          .eq("user_id", userId),
      clinicId &&
        admin.from("clinics").update({ name: patientFields.clinic_name }).eq("id", clinicId).eq("user_id", userId),
      vetId &&
        admin.from("clinic_vets").update({ name: patientFields.responsible_vet }).eq("id", vetId).eq("user_id", userId),
    ].filter(Boolean),
  );

  revalidateTag(`report-${id}`, "default");
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { error } = await admin
    .from("reports")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Report delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir laudo." }, { status: 500 });
  }

  revalidateTag(`report-${id}`, "default");
  return NextResponse.json({ ok: true });
}
