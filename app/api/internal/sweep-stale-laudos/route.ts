import { NextRequest, NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { REPORT_STATUSES } from "@/shared/models";
import { logError } from "@/lib/log";

const STALE_MINUTES = 10;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();
  const supabase = createAdmin();

  const { data, error } = await supabase
    .from("reports")
    .update({
      status: REPORT_STATUSES.failed,
      error_message: "Timeout — tente novamente.",
      generation_completed_at: new Date().toISOString(),
    })
    .in("status", [REPORT_STATUSES.pending, REPORT_STATUSES.generating])
    .lt("generation_started_at", cutoff)
    .select("id");

  if (error) {
    logError("Stale sweep failed", error);
    return NextResponse.json({ error: "Sweep failed." }, { status: 500 });
  }

  return NextResponse.json({ swept: data?.length ?? 0 });
}
