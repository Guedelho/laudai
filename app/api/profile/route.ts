import { NextResponse } from "next/server";
import { UpdateProfileRequest } from "@/shared/interfaces";
import { withApiHandler } from "@/lib/api-handler";
import { invalidateUserPdfCache } from "@/lib/supabase/db";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const PUT = withApiHandler(async ({ userId, admin, audit, req }) => {
  const body: UpdateProfileRequest = await req.json();
  const { full_name, signature_font, signature_image_url, signature } = body;

  const { data: existing } = await admin.from(TABLES.profiles).select("*").eq("id", userId).maybeSingle();

  const upsertData = {
    id: userId,
    full_name,
    signature_font,
    signature,
    ...(!existing ? { cpf: body.cpf, crmv: body.crmv, crmv_state: body.crmv_state } : {}),
    ...("signature_image_url" in body ? { signature_image_url } : {}),
  };

  const { data, error } = await admin.from(TABLES.profiles).upsert(upsertData, { onConflict: "id" }).select().single();

  if (error) {
    logError("Profile save failed", error, { userId });
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  await audit({
    action: existing ? AUDIT_ACTIONS.update : AUDIT_ACTIONS.create,
    entityType: AUDIT_ENTITIES.profile,
    entityId: userId,
    changes: existing ? { before: existing, after: data } : data,
  });

  return NextResponse.json(data);
});
