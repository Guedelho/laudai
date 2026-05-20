import { NextResponse } from "next/server";
import { parseProfileImage } from "@/lib/server-utils";
import { STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { withApiHandler } from "@/lib/api-handler";
import { invalidateUserPdfCache } from "@/lib/supabase/db";
import { serveProfileImage } from "@/lib/profile-image";
import { logError } from "@/lib/log";

const BUCKET = STORAGE_BUCKETS.profileLogos;

type Kind = "logo" | "signature";

const CONFIG = {
  logo: { column: "logo_url", file: "logo", label: "logo", extraOnUpload: {} as Record<string, unknown> },
  signature: {
    column: "signature_image_url",
    file: "signature",
    label: "imagem de assinatura",
    extraOnUpload: { signature_font: null },
  },
} as const;

function parseKind(raw: string): Kind | null {
  return raw === "logo" || raw === "signature" ? raw : null;
}

export const GET = withApiHandler<{ kind: string }>(
  async ({ userId, admin, params }) => {
    const kind = parseKind(params.kind);
    if (!kind) return new NextResponse(null, { status: 404 });

    const { column } = CONFIG[kind];
    const { data: profile } = await admin.from(TABLES.profiles).select(column).eq("id", userId).single();
    const path = (profile as Record<string, string | null> | null)?.[column];
    if (!path) return new NextResponse(null, { status: 404 });
    return serveProfileImage(admin, path);
  },
  { botId: false },
);

export const POST = withApiHandler<{ kind: string }>(async ({ userId, admin, req, params }) => {
  const kind = parseKind(params.kind);
  if (!kind) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { column, file, label, extraOnUpload } = CONFIG[kind];
  const formData = await req.formData();
  const result = await parseProfileImage(formData.get(file) as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { buf, ext, mime } = result;
  const storagePath = `${userId}/${kind}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mime, upsert: true });

  if (uploadError) {
    logError(`${kind} upload failed`, uploadError, { userId });
    return NextResponse.json({ error: `Erro ao enviar ${label}.` }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from(TABLES.profiles)
    .update({ [column]: storagePath, ...extraOnUpload })
    .eq("id", userId);

  if (updateError) {
    logError(`Profile ${column} update failed`, updateError, { userId });
    return NextResponse.json({ error: `Erro ao salvar ${label} no perfil.` }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiHandler<{ kind: string }>(async ({ userId, admin, params }) => {
  const kind = parseKind(params.kind);
  if (kind !== "signature") return NextResponse.json({ error: "Not allowed." }, { status: 405 });

  const { error } = await admin.from(TABLES.profiles).update({ signature_image_url: null }).eq("id", userId);

  if (error) {
    logError("Signature remove failed", error, { userId });
    return NextResponse.json({ error: "Erro ao remover assinatura." }, { status: 500 });
  }

  await invalidateUserPdfCache(admin, userId);
  return NextResponse.json({ ok: true });
});
