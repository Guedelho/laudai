import { NextResponse } from "next/server";
import { UpdateProfileRequest } from "@/shared/interfaces";
import { withApiHandler } from "@/lib/api-handler";
import { invalidateUserPdfCache } from "@/lib/report/cache";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const PUT = withApiHandler(async ({ userId, admin, audit, req }) => {
  const body: UpdateProfileRequest = await req.json();
  const { full_name, signature_font, signature_image_url, signature } = body;

  const { data: existing } = await admin.from(TABLES.profiles).select("*").eq("id", userId).maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Perfil não encontrado." }, { status: 404 });
  }

  const { data, error } = await admin
    .from(TABLES.profiles)
    .update({
      full_name,
      signature_font,
      signature,
      ...("signature_image_url" in body ? { signature_image_url } : {}),
    })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    logError("Profile save failed", error, { userId });
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  await audit({
    action: AUDIT_ACTIONS.update,
    entityType: AUDIT_ENTITIES.profile,
    entityId: userId,
    changes: { before: existing, after: data },
  });

  return NextResponse.json(data);
});
