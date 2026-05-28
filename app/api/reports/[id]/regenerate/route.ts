import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withApiHandler } from "@/lib/api-handler";
import { runGeneration } from "@/lib/report/worker";
import { REPORT_STATUSES, TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const maxDuration = 300;

export const POST = withApiHandler<{ id: string }>(
  async ({ userId, orgId, admin, params }) => {
    const { data: report, error } = await admin
      .from(TABLES.reports)
      .select("id, user_id, status, raw_input, patient_name, species, breed, age, sex, neutered, owner_name")
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

    // The worker scopes its writes by user_id, so it must run as the report's
    // original author — a teammate regenerating would otherwise update 0 rows.
    after(() =>
      runGeneration(admin, report.id, report.user_id, {
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
  { rateLimit: { endpoint: "reports.regenerate", max: 10, windowSec: 60 } },
);
