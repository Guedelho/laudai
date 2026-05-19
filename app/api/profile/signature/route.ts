import { NextResponse } from "next/server";
import { parseProfileImage } from "@/lib/server-utils";
import { SIGNED_URL_TTL, STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { withApiHandler } from "@/lib/api-handler";
import { invalidateUserPdfCache } from "@/lib/supabase/db";
import { logError } from "@/lib/log";

const BUCKET = STORAGE_BUCKETS.profileLogos;

export const GET = withApiHandler(async ({ userId, admin }) => {
  const { data: profile } = await admin.from(TABLES.profiles).select("signature_image_url").eq("id", userId).single();
  if (!profile?.signature_image_url) return new NextResponse(null, { status: 404 });

  const { data: signed, error } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(profile.signature_image_url, SIGNED_URL_TTL.serverFetch);
  if (error || !signed?.signedUrl) return new NextResponse(null, { status: 404 });

  const upstream = await fetch(signed.signedUrl);
  if (!upstream.ok) return new NextResponse(null, { status: 404 });

  return new NextResponse(await upstream.arrayBuffer(), {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600, must-revalidate",
    },
  });
});

export const POST = withApiHandler(async ({ userId, admin, req }) => {
  const formData = await req.formData();
  const result = await parseProfileImage(formData.get("signature") as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { buf, ext, mime } = result;
  const storagePath = `${userId}/signature.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mime, upsert: true });

  if (uploadError) {
    logError("Signature upload failed", uploadError, { userId });
    return NextResponse.json({ error: "Erro ao enviar imagem de assinatura." }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from(TABLES.profiles)
    .update({ signature_image_url: storagePath, signature_font: null })
    .eq("id", userId);

  if (updateError) {
    logError("Profile signature_image_url update failed", updateError, { userId });
    return NextResponse.json({ error: "Erro ao salvar assinatura no perfil." }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiHandler(async ({ userId, admin }) => {
  const { error } = await admin.from(TABLES.profiles).update({ signature_image_url: null }).eq("id", userId);

  if (error) {
    logError("Signature remove failed", error, { userId });
    return NextResponse.json({ error: "Erro ao remover assinatura." }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  return NextResponse.json({ ok: true });
});
