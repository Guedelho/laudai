import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { createAdmin } from "@/lib/supabase/admin";
import { TABLES } from "@/shared/constants";
import { validateAccountFields, normalizeAccount, firstFieldError } from "@/lib/account";
import { logError } from "@/lib/log";
import type { SignupValidateRequest, AccountFieldError } from "@/shared/interfaces";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(field: AccountFieldError["field"], error: string, status = 400) {
  return NextResponse.json({ field, error }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const { isBot } = await checkBotId();
    if (isBot) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

    const body = (await req.json()) as SignupValidateRequest;
    const email = (body.email ?? "").trim();
    const password = body.password ?? "";
    if (!EMAIL_RE.test(email)) return bad("email", "Email inválido.");
    if (password.length < 8) return bad("password", "A senha deve ter ao menos 8 caracteres.");

    const fieldError = firstFieldError(validateAccountFields(body));
    if (fieldError) return bad(fieldError.field, fieldError.error);

    const { cpf, crmv, crmv_state } = normalizeAccount(body);
    const admin = createAdmin();

    const { data: cpfHit } = await admin.from(TABLES.profiles).select("id").eq("cpf", cpf).maybeSingle();
    if (cpfHit) return bad("cpf", "Este CPF já está cadastrado.", 409);

    const { data: crmvHit } = await admin
      .from(TABLES.profiles)
      .select("id")
      .eq("crmv", crmv)
      .eq("crmv_state", crmv_state)
      .maybeSingle();
    if (crmvHit) return bad("crmv", "Este CRMV já está cadastrado neste estado.", 409);

    return NextResponse.json({ ok: true });
  } catch (err) {
    logError("signup-validate failed", err, { path: "/api/auth/signup-validate" });
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
