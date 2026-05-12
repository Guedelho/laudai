import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { createAdmin } from "@/lib/supabase/admin";

const MAX_LIMIT = 50;

export const GET = withApiHandler({}, async ({ userId, req }) => {
  const url = new URL(req.url);
  const requestedLimit = Number.parseInt(url.searchParams.get("limit") ?? "5", 10);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), MAX_LIMIT) : 5;
  const before = url.searchParams.get("before");

  const admin = createAdmin();
  let query = admin
    .from("reports")
    .select("id, patient_name, owner_name, clinic_name, specialty, created_at, exam_date, status, error_message")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (before) query = query.lt("created_at", before);

  const { data, error } = await query;
  if (error) {
    console.error("List reports error:", error);
    return NextResponse.json({ error: "Erro ao buscar laudos." }, { status: 500 });
  }

  return NextResponse.json({ reports: data ?? [] });
});
