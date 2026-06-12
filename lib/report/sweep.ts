import "server-only";

import type { createAdmin } from "@/lib/supabase/admin";
import { REPORT_STATUSES, TABLES } from "@/shared/constants";
import { logError, logInfo } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

const STUCK_TIMEOUT_MS = 10 * 60 * 1000;
const STUCK_ERROR_MESSAGE = "A geração demorou mais que o esperado e foi interrompida. Tente novamente.";

export async function sweepStuckReports(admin: Admin, orgId?: string): Promise<number> {
  const cutoff = new Date(Date.now() - STUCK_TIMEOUT_MS).toISOString();
  const base = admin
    .from(TABLES.reports)
    .update({ status: REPORT_STATUSES.failed, error_message: STUCK_ERROR_MESSAGE })
    .or(
      `and(status.eq.${REPORT_STATUSES.pending},created_at.lt.${cutoff}),and(status.eq.${REPORT_STATUSES.generating},generation_started_at.lt.${cutoff})`,
    );
  const { data, error } = await (orgId ? base.eq("org_id", orgId) : base).select("id");
  if (error) {
    logError("sweepStuckReports failed", error, { orgId });
    return 0;
  }
  const swept = data?.length ?? 0;
  if (swept) logInfo("sweepStuckReports flipped stuck reports to failed", { swept, orgId });
  return swept;
}
