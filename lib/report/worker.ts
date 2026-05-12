import "server-only";

import { revalidateTag } from "next/cache";
import { generateReport } from "@/lib/report/generate";
import { createAdmin } from "@/lib/supabase/admin";
import { reportCacheTag } from "@/lib/utils";
import { REPORT_STATUSES, type PatientFields } from "@/shared/models";

type Admin = ReturnType<typeof createAdmin>;

interface WorkerParams extends PatientFields {
  rawInput: string;
}

export async function runGeneration(
  supabase: Admin,
  reportId: string,
  userId: string,
  params: WorkerParams,
): Promise<void> {
  await supabase
    .from("reports")
    .update({ status: REPORT_STATUSES.generating, generation_started_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("user_id", userId);

  try {
    const content = await generateReport(params);

    const { error } = await supabase
      .from("reports")
      .update({
        status: REPORT_STATUSES.completed,
        generated_content: content,
        edited_content: content,
        generation_completed_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", reportId)
      .eq("user_id", userId);

    if (error) throw error;
  } catch (err) {
    console.error("Background generation failed:", err);
    await supabase
      .from("reports")
      .update({
        status: REPORT_STATUSES.failed,
        error_message: err instanceof Error ? err.message : "Erro ao gerar laudo.",
        generation_completed_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", userId);
  }

  revalidateTag(reportCacheTag(reportId), "max");
}
