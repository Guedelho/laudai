import { NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/profile";
import { GenerateRequest } from "@/shared/interfaces";
import { createReport } from "@/lib/report/create";
import { withApiHandler } from "@/lib/api-handler";
import { REPORT_TYPES } from "@/shared/constants";

export const maxDuration = 300;

export const POST = withApiHandler(
  async ({ userId, orgId, admin, audit, req }) => {
    const [profile, body] = await Promise.all([getProfile(admin, userId), req.json() as Promise<GenerateRequest>]);

    if (!profile) return NextResponse.json({ error: "Perfil não encontrado. Complete seu cadastro." }, { status: 400 });

    if (!Object.values(REPORT_TYPES).includes(body.specialty)) {
      return NextResponse.json({ error: "Tipo de laudo inválido." }, { status: 400 });
    }

    const result = await createReport(admin, { userId, orgId, audit }, body);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    return NextResponse.json({ reportId: result.reportId });
  },
  { rateLimit: { endpoint: "reports.generate", max: 10, windowSec: 60 } },
);
