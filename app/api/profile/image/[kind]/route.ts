import { NextResponse } from "next/server";
import { parseProfileImage } from "@/lib/server-utils";
import { STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { withApiHandler } from "@/lib/api-handler";
import { invalidateUserPdfCache } from "@/lib/supabase/db";
import { serveProfileImage } from "@/lib/profile-image";
import { logError } from "@/lib/log";

const BUCKET = STORAGE_BUCKETS.profileLogos;

// Only the personal signature lives per-user here. The client logo is org-level
// (see /api/org/logo).
type Kind = "signature";

function parseKind(raw: string): Kind | null {
  return raw === "signature" ? raw : null;
}

export const GET = withApiHandler<{ kind: string }>(
  async ({ userId, admin, params }) => {
    if (!parseKind(params.kind)) return new NextResponse(null, { status: 404 });

    const { data: profile } = await admin.from(TABLES.profiles).select("signature_image_url").eq("id", userId).single();
    const path = profile?.signature_image_url;
    if (!path) return new NextResponse(null, { status: 404 });
    return serveProfileImage(admin, path);
  },
  { botId: false },
);

export const POST = withApiHandler<{ kind: string }>(async ({ userId, admin, req, params }) => {
  if (!parseKind(params.kind)) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const formData = await req.formData();
  const result = await parseProfileImage(formData.get("signature") as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { buf, ext, mime } = result;
  const storagePath = `${userId}/signature.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mime, upsert: true });

  if (uploadError) {
    logError("signature upload failed", uploadError, { userId });
    return NextResponse.json({ error: "Erro ao enviar imagem de assinatura." }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from(TABLES.profiles)
    .update({ signature_image_url: storagePath, signature_font: null })
    .eq("id", userId);

  if (updateError) {
    logError("Profile signature_image_url update failed", updateError, { userId });
    return NextResponse.json({ error: "Erro ao salvar imagem de assinatura no perfil." }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiHandler<{ kind: string }>(async ({ userId, admin, params }) => {
  if (!parseKind(params.kind)) return NextResponse.json({ error: "Not allowed." }, { status: 405 });

  const { error } = await admin.from(TABLES.profiles).update({ signature_image_url: null }).eq("id", userId);

  if (error) {
    logError("Signature remove failed", error, { userId });
    return NextResponse.json({ error: "Erro ao remover assinatura." }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  return NextResponse.json({ ok: true });
});
