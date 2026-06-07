import "server-only";

import { NextResponse } from "next/server";
import { withPublicHandler } from "@/lib/api-handler";
import { TABLES } from "@/shared/constants";
import { validateAccountFields, normalizeAccount, firstFieldError } from "@/lib/account";
import type { SignupValidateRequest, AccountFieldError } from "@/shared/interfaces";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(field: AccountFieldError["field"], error: string, status = 400) {
  return NextResponse.json({ field, error }, { status });
}

export const POST = withPublicHandler(async ({ req, admin }) => {
  const body = (await req.json()) as SignupValidateRequest;
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  if (!EMAIL_RE.test(email)) return bad("email", "Email inválido.");
  if (password.length < 8) return bad("password", "A senha deve ter ao menos 8 caracteres.");

  const fieldError = firstFieldError(validateAccountFields(body));
  if (fieldError) return bad(fieldError.field, fieldError.error);

  const { cpf, crmv, crmv_state } = normalizeAccount(body);

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
});
