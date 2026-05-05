import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { parseProfileImage } from "@/lib/server-utils";
import { SIGNED_URL_TTL } from "@/shared/constants";
import { withApiHandler } from "@/lib/api-handler";
import { invalidateUserPdfCache } from "@/lib/supabase/db";

const BUCKET = "profile-logos";

export const GET = withApiHandler({}, async ({ userId }) => {
  const admin = createAdmin();
  const { data: profile } = await admin.from("profiles").select("logo_url").eq("id", userId).single();

  if (!profile?.logo_url) return new NextResponse(null, { status: 404 });

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(profile.logo_url, SIGNED_URL_TTL.serverFetch);

  if (error || !data?.signedUrl) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(data.signedUrl);
});

export const POST = withApiHandler({}, async ({ userId, req }) => {
  const formData = await req.formData();
  const result = await parseProfileImage(formData.get("logo") as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { buf, ext, mime } = result;
  const storagePath = `${userId}/logo.${ext}`;
  const admin = createAdmin();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mime, upsert: true });

  if (uploadError) {
    console.error("Logo upload error:", uploadError);
    return NextResponse.json({ error: "Erro ao enviar logo." }, { status: 500 });
  }

  const { error: updateError } = await admin.from("profiles").update({ logo_url: storagePath }).eq("id", userId);

  if (updateError) {
    console.error("Profile logo_url update error:", updateError);
    return NextResponse.json({ error: "Erro ao salvar logo no perfil." }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  return NextResponse.json({ ok: true });
});
