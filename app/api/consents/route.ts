import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { LEGAL_VERSIONS, TABLES, type LegalDocType } from "@/shared/constants";
import { logError } from "@/lib/log";

interface ConsentRequest {
  type: LegalDocType;
  version: string;
}

export const POST = withApiHandler({}, async ({ userId, admin, req }) => {
  const { type, version } = (await req.json()) as ConsentRequest;

  if (type !== "terms" && type !== "privacy_policy") {
    return NextResponse.json({ error: "Tipo de consentimento inválido." }, { status: 400 });
  }
  if (version !== LEGAL_VERSIONS[type]) {
    return NextResponse.json({ error: "Versão do documento desatualizada." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const { error } = await admin.from(TABLES.consents).insert({ user_id: userId, type, version, ip });

  if (error) {
    logError("Consent insert failed", error, { userId, type, version });
    return NextResponse.json({ error: "Erro ao registrar consentimento." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
});
