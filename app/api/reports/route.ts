import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

const MAX_LIMIT = 50;
const MAX_SEARCH_LEN = 100;

export const GET = withApiHandler({}, async ({ userId, orgId, admin, req }) => {
  const url = new URL(req.url);
  const requestedLimit = Number.parseInt(url.searchParams.get("limit") ?? "5", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT) : 5;
  const before = url.searchParams.get("before");
  const q = url.searchParams
    .get("q")
    ?.trim()
    .slice(0, MAX_SEARCH_LEN)
    .replace(/[,()*]/g, "");

  let query = admin
    .from(TABLES.reports)
    .select(
      "id, patient_name, owner_name, clinic_name, specialty, created_at, exam_date, status, error_message, user_id",
    )
    .eq("org_id", orgId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (q) {
    query = query.or(`patient_name.ilike.%${q}%,owner_name.ilike.%${q}%,clinic_name.ilike.%${q}%`);
  } else if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query;
  if (error) {
    logError("List reports failed", error, { userId, orgId, hasQuery: !!q });
    return NextResponse.json({ error: "Erro ao buscar laudos." }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [] });
});
