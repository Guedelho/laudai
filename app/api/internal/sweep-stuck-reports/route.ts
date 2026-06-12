import { NextRequest, NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { bearerOk } from "@/lib/cron-auth";
import { sweepStuckReports } from "@/lib/report/sweep";

export async function GET(req: NextRequest) {
  if (!bearerOk(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const swept = await sweepStuckReports(createAdmin());
  return NextResponse.json({ swept });
}
