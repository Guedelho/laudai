import { after } from "next/server";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { runGeneration } from "@/lib/report/worker";
import { getProfile } from "@/lib/supabase/auth";
import { GenerateRequest } from "@/shared/interfaces";
import { canWriteReport, findOrCreatePet, hasReportTypeAccess, resolveOwnedFks } from "@/lib/supabase/db";
import { withApiHandler } from "@/lib/api-handler";
import { REPORT_TYPES, TABLES } from "@/shared/constants";
import { REPORT_STATUSES } from "@/shared/models";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { logError } from "@/lib/log";

export const maxDuration = 300;

export const POST = withApiHandler(
  async ({ userId, orgId, admin, audit, req }) => {
    const [profile, body] = await Promise.all([getProfile(userId), req.json() as Promise<GenerateRequest>]);

    if (!profile) return NextResponse.json({ error: "Perfil não encontrado. Complete seu cadastro." }, { status: 400 });

    const {
      specialty,
      rawInput,
      patientName,
      species,
      breed,
      age,
      sex,
      neutered,
      ownerName,
      clinicName,
      responsibleVet,
      examDate,
      petId,
      clinicId,
      vetId,
    } = body;

    const required: [string, string][] = [
      [patientName, "Nome do paciente"],
      [ownerName, "Nome do tutor"],
      [breed, "Raça"],
      [age, "Idade"],
      [clinicName, "Nome da clínica"],
      [responsibleVet, "Médico responsável"],
      [examDate, "Data do exame"],
      [rawInput, "Achados do exame"],
    ];
    for (const [value, label] of required) {
      if (!value.trim()) return NextResponse.json({ error: `${label} é obrigatório(a).` }, { status: 400 });
    }
    if (rawInput.length > 2_000)
      return NextResponse.json({ error: "Achados do exame muito longos. Máximo 2.000 caracteres." }, { status: 400 });

    if (!Object.values(REPORT_TYPES).includes(specialty)) {
      return NextResponse.json({ error: "Tipo de laudo inválido." }, { status: 400 });
    }
    if (!(await hasReportTypeAccess(admin, orgId, specialty))) {
      return NextResponse.json({ error: "Sua organização não tem acesso a este tipo de laudo." }, { status: 403 });
    }
    if (!(await canWriteReport(admin, orgId, userId, specialty))) {
      return NextResponse.json({ error: "Você não tem permissão para gerar este tipo de laudo." }, { status: 403 });
    }

    const ownedFks = await resolveOwnedFks(admin, orgId, { petId, clinicId, vetId });

    let resolvedPetId: string | null = ownedFks.petId;
    if (!resolvedPetId) {
      const pet = await findOrCreatePet(admin, userId, orgId, patientName.trim(), ownerName.trim(), {
        species,
        breed,
        age,
        sex,
        neutered,
      });
      resolvedPetId = pet?.id ?? null;
    }

    const { data: report, error } = await admin
      .from(TABLES.reports)
      .insert({
        user_id: userId,
        org_id: orgId,
        status: REPORT_STATUSES.pending,
        specialty,
        patient_name: patientName,
        species,
        breed,
        age,
        owner_name: ownerName,
        raw_input: rawInput,
        sex,
        neutered,
        clinic_name: clinicName,
        responsible_vet: responsibleVet,
        exam_date: examDate,
        pet_id: resolvedPetId,
        clinic_id: ownedFks.clinicId,
        vet_id: ownedFks.vetId,
      })
      .select("id")
      .single();

    if (error) {
      logError("Generate insert failed", error, { userId, orgId });
      return NextResponse.json({ error: "Erro ao salvar laudo." }, { status: 500 });
    }

    revalidatePath("/dashboard");
    await audit({ action: AUDIT_ACTIONS.create, entityType: AUDIT_ENTITIES.report, entityId: report.id });

    after(() =>
      runGeneration(admin, report.id, userId, {
        rawInput,
        patientName,
        species,
        breed,
        age,
        sex,
        neutered,
        ownerName,
      }),
    );

    return NextResponse.json({ reportId: report.id });
  },
  { rateLimit: { endpoint: "reports.generate", max: 10, windowSec: 60 } },
);
