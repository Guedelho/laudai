import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { UpdateProfileRequest } from "@/shared/interfaces";
import { withApiHandler } from "@/lib/api-handler";
import { invalidateUserPdfCache } from "@/lib/supabase/db";

export const PUT = withApiHandler({}, async ({ userId, req }) => {
  const admin = createAdmin();
  const body: UpdateProfileRequest = await req.json();
  const { full_name, signature_font, signature_image_url, signature } = body;

  const { data: existing } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();

  const upsertData = {
    id: userId,
    full_name,
    signature_font,
    signature,
    ...(!existing ? { cpf: body.cpf, crmv: body.crmv, crmv_state: body.crmv_state } : {}),
    ...("signature_image_url" in body ? { signature_image_url } : {}),
  };

  const { data, error } = await admin.from("profiles").upsert(upsertData, { onConflict: "id" }).select().single();

  if (error) {
    console.error("Profile save error:", error);
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }

  // Profile fields are embedded in cached PDFs — drop them.
  await invalidateUserPdfCache(admin, userId);

  return NextResponse.json(data);
});
