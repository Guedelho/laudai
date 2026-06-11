import "server-only";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdmin } from "@/lib/supabase/admin";
import { runGeneration } from "@/lib/report/worker";
import { canWriteReport, hasReportTypeAccess } from "@/lib/supabase/entitlements";
import { findOrCreatePet, resolveOwnedFks } from "@/lib/supabase/upserts";
import { REPORT_STATUSES, TABLES, type ReportType } from "@/shared/constants";
import { AUDIT_ACTIONS, AUDIT_ENTITIES, type AuditFn } from "@/lib/audit";
import { type ReportFields } from "@/shared/models";
import { logError } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

const MAX_RAW_INPUT_LENGTH = 2_000;

interface CreateReportInput extends ReportFields {
  specialty: ReportType;
  rawInput: string;
  petId?: string | null;
  clientId?: string | null;
  vetId?: string | null;
}

type CreateReportResult = { reportId: string } | { error: string; status: 400 | 403 | 500 };

export async function createReport(
  admin: Admin,
  ctx: { userId: string; orgId: string; audit: AuditFn },
  input: CreateReportInput,
): Promise<CreateReportResult> {
  const { userId, orgId, audit } = ctx;

  const required: [string | undefined, string][] = [
    [input.patientName, "Nome do paciente"],
    [input.ownerName, "Nome do tutor"],
    [input.breed, "Raça"],
    [input.age, "Idade"],
    [input.clientName, "Nome do cliente"],
    [input.responsibleVet, "Médico responsável"],
    [input.examDate, "Data do exame"],
    [input.rawInput, "Achados do exame"],
  ];
  for (const [value, label] of required) {
    if (!value?.trim()) return { error: `${label} é obrigatório(a).`, status: 400 };
  }
  if (input.rawInput.length > MAX_RAW_INPUT_LENGTH) {
    return { error: "Achados do exame muito longos. Máximo 2.000 caracteres.", status: 400 };
  }

  if (!(await hasReportTypeAccess(admin, orgId, input.specialty))) {
    return { error: "Sua organização não tem acesso a este tipo de laudo.", status: 403 };
  }
  if (!(await canWriteReport(admin, orgId, userId, input.specialty))) {
    return { error: "Você não tem permissão para gerar este tipo de laudo.", status: 403 };
  }

  const ownedFks = await resolveOwnedFks(admin, orgId, {
    petId: input.petId,
    clientId: input.clientId,
    vetId: input.vetId,
  });

  let resolvedPetId: string | null = ownedFks.petId;
  if (!resolvedPetId) {
    const pet = await findOrCreatePet(admin, userId, orgId, input.patientName.trim(), input.ownerName.trim(), {
      species: input.species,
      breed: input.breed,
      age: input.age,
      sex: input.sex,
      neutered: input.neutered,
    });
    resolvedPetId = pet?.id ?? null;
  }

  const { data: report, error } = await admin
    .from(TABLES.reports)
    .insert({
      user_id: userId,
      org_id: orgId,
      status: REPORT_STATUSES.pending,
      specialty: input.specialty,
      patient_name: input.patientName,
      species: input.species,
      breed: input.breed,
      age: input.age,
      owner_name: input.ownerName,
      raw_input: input.rawInput,
      sex: input.sex,
      neutered: input.neutered,
      client_name: input.clientName,
      responsible_vet: input.responsibleVet,
      exam_date: input.examDate,
      pet_id: resolvedPetId,
      client_id: ownedFks.clientId,
      vet_id: ownedFks.vetId,
    })
    .select("id")
    .single();

  if (error) {
    logError("Report insert failed", error, { userId, orgId });
    return { error: "Erro ao salvar laudo.", status: 500 };
  }

  revalidatePath("/dashboard");
  await audit({ action: AUDIT_ACTIONS.create, entityType: AUDIT_ENTITIES.report, entityId: report.id });

  after(() =>
    runGeneration(admin, report.id, userId, {
      rawInput: input.rawInput,
      patientName: input.patientName,
      species: input.species,
      breed: input.breed,
      age: input.age,
      sex: input.sex,
      neutered: input.neutered,
      ownerName: input.ownerName,
    }),
  );

  return { reportId: report.id };
}
