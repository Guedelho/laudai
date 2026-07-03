import "server-only";

import { revalidatePath, revalidateTag } from "next/cache";
import { generateReport } from "@/lib/report/generate";
import { createAdmin } from "@/lib/supabase/admin";
import { reportCacheTag } from "@/lib/utils";
import { REPORT_STATUSES, TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";
import { type PatientFields } from "@/shared/models";

type Admin = ReturnType<typeof createAdmin>;

interface WorkerParams extends PatientFields {
  rawInput: string;
}

const GENERATION_TIMEOUT_MS = 5 * 60 * 1000;

export async function runGeneration(
  supabase: Admin,
  reportId: string,
  userId: string,
  params: WorkerParams,
): Promise<void> {
  await supabase
    .from(TABLES.reports)
    .update({ status: REPORT_STATUSES.generating, generation_started_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("user_id", userId);

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const content = await Promise.race([
      generateReport(params),
      new Promise<never>((_, reject) => {
        timeoutHandle = setTimeout(
          () => reject(new Error("Tempo limite de geração excedido. Tente novamente.")),
          GENERATION_TIMEOUT_MS,
        );
      }),
    ]);

    const { error } = await supabase
      .from(TABLES.reports)
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
    logError("Background generation failed", err, { reportId, userId });
    await supabase
      .from(TABLES.reports)
      .update({
        status: REPORT_STATUSES.failed,
        error_message: err instanceof Error ? err.message : "Erro ao gerar laudo.",
        generation_completed_at: new Date().toISOString(),
      })
      .eq("id", reportId)
      .eq("user_id", userId);
  } finally {
    clearTimeout(timeoutHandle);
  }

  revalidateTag(reportCacheTag(reportId), "max");
  revalidatePath("/dashboard");
}
