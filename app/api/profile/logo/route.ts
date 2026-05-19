import { NextResponse } from "next/server";
import { parseProfileImage } from "@/lib/server-utils";
import { SIGNED_URL_TTL, STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { withApiHandler } from "@/lib/api-handler";
import { invalidateUserPdfCache } from "@/lib/supabase/db";
import { logError } from "@/lib/log";

const BUCKET = STORAGE_BUCKETS.profileLogos;

export const GET = withApiHandler(async ({ userId, admin }) => {
  const { data: profile } = await admin.from(TABLES.profiles).select("logo_url").eq("id", userId).single();
  if (!profile?.logo_url) return new NextResponse(null, { status: 404 });

  const { data, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(profile.logo_url, SIGNED_URL_TTL.serverFetch);
  if (error || !data?.signedUrl) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(data.signedUrl);
});

export const POST = withApiHandler(async ({ userId, admin, req }) => {
  const formData = await req.formData();
  const result = await parseProfileImage(formData.get("logo") as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { buf, ext, mime } = result;
  const storagePath = `${userId}/logo.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mime, upsert: true });

  if (uploadError) {
    logError("Logo upload failed", uploadError, { userId });
    return NextResponse.json({ error: "Erro ao enviar logo." }, { status: 500 });
  }

  const { error: updateError } = await admin.from(TABLES.profiles).update({ logo_url: storagePath }).eq("id", userId);

  if (updateError) {
    logError("Profile logo_url update failed", updateError, { userId });
    return NextResponse.json({ error: "Erro ao salvar logo no perfil." }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  return NextResponse.json({ ok: true });
});
