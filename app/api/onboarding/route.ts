import "server-only";

import { NextResponse } from "next/server";
import { withAuthHandler, clientIp } from "@/lib/api-handler";
import { getProfile } from "@/lib/supabase/profile";
import { provisionAccount, recordSignupConsents, AccountConflictError } from "@/lib/supabase/provisioning";
import { logAudit, AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { validateAccountFields, firstFieldError } from "@/lib/account";
import type { OnboardingRequest, AccountFieldError } from "@/shared/interfaces";

function bad(field: AccountFieldError["field"], error: string, status = 400) {
  return NextResponse.json({ field, error }, { status });
}

export const POST = withAuthHandler(async ({ userId, req, admin }) => {
  const body = (await req.json()) as OnboardingRequest;
  const fieldError = firstFieldError(validateAccountFields(body));
  if (fieldError) return bad(fieldError.field, fieldError.error);

  if (await getProfile(admin, userId)) return NextResponse.json({ ok: true });

  try {
    const orgId = await provisionAccount(admin, userId, body);
    await logAudit(admin, {
      orgId,
      userId,
      action: AUDIT_ACTIONS.create,
      entityType: AUDIT_ENTITIES.profile,
      entityId: userId,
    });
    await logAudit(admin, {
      orgId,
      userId,
      action: AUDIT_ACTIONS.create,
      entityType: AUDIT_ENTITIES.organization,
      entityId: orgId,
    });
    await recordSignupConsents(admin, userId, clientIp(req));
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AccountConflictError) {
      return err.field === "cpf"
        ? bad("cpf", "Este CPF já está cadastrado.", 409)
        : bad("crmv", "Este CRMV já está cadastrado neste estado.", 409);
    }
    throw err;
  }
});
