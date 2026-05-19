import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withApiHandler } from "@/lib/api-handler";
import { runGeneration } from "@/lib/report/worker";
import { RATE_LIMITS, TABLES } from "@/shared/constants";
import { REPORT_STATUSES } from "@/shared/models";
import { logError } from "@/lib/log";

export const maxDuration = 300;

export const POST = withApiHandler<{ id: string }>(
  { ...RATE_LIMITS.generate, botId: true },
  async ({ userId, orgId, admin, params }) => {
    const { data: report, error } = await admin
      .from(TABLES.reports)
      .select("id, status, raw_input, patient_name, species, breed, age, sex, neutered, owner_name")
      .eq("id", params.id)
      .eq("org_id", orgId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      logError("Regenerate report read failed", error, { userId, reportId: params.id });
      return NextResponse.json({ error: "Erro ao recuperar laudo." }, { status: 500 });
    }
    if (!report) return NextResponse.json({ error: "Laudo não encontrado." }, { status: 404 });
    if (report.status !== REPORT_STATUSES.failed)
      return NextResponse.json({ error: "Apenas laudos com falha podem ser regerados." }, { status: 409 });

    await admin
      .from(TABLES.reports)
      .update({ status: REPORT_STATUSES.pending, error_message: null, generation_completed_at: null })
      .eq("id", report.id)
      .eq("org_id", orgId);

    revalidatePath("/dashboard");

    after(() =>
      runGeneration(admin, report.id, userId, {
        rawInput: report.raw_input,
        patientName: report.patient_name,
        species: report.species,
        breed: report.breed,
        age: report.age,
        sex: report.sex,
        neutered: report.neutered,
        ownerName: report.owner_name,
      }),
    );

    return NextResponse.json({ reportId: report.id });
  },
);
