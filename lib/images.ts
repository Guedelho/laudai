import "server-only";

import { NextResponse } from "next/server";
import sharp from "sharp";
import { createAdmin } from "@/lib/supabase/admin";
import { MAX_IMAGE_FILE_SIZE, SIGNED_URL_TTL, STORAGE_BUCKETS } from "@/shared/constants";

type Admin = ReturnType<typeof createAdmin>;

// ─── Format detection (shared by profile + report image routes) ────────────

const SHARP_FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function detectImageFormat(
  buf: Buffer,
  allow: ReadonlySet<string>,
): Promise<{ mime: string; ext: string } | null> {
  try {
    const { format } = await sharp(buf).metadata();
    if (!format || !allow.has(format)) return null;
    return { mime: SHARP_FORMAT_TO_MIME[format] ?? "image/jpeg", ext: format === "jpeg" ? "jpg" : format };
  } catch {
    return null;
  }
}

// ─── Profile image (signature/logo): JPEG/PNG only ─────────────────────────

const PROFILE_ALLOWED = new Set(["jpeg", "png"]);

type ImageError = { ok: false; status: number; error: string };
type ImageOk = { ok: true; buf: Buffer; ext: string; mime: string };

export async function parseProfileImage(file: File | null): Promise<ImageError | ImageOk> {
  if (!file) return { ok: false, status: 400, error: "Arquivo não enviado." };
  if (file.size > MAX_IMAGE_FILE_SIZE) return { ok: false, status: 400, error: "Arquivo muito grande. Máximo 5 MB." };

  const buf = Buffer.from(await file.arrayBuffer());
  const detected = await detectImageFormat(buf, PROFILE_ALLOWED);
  if (!detected) return { ok: false, status: 400, error: "Formato inválido. Use JPEG ou PNG." };

  return { ok: true, buf, ext: detected.ext, mime: detected.mime };
}

// ─── Profile image serving (stream through the route) ──────────────────────

// Signed URLs expire; streaming through the route keeps the browser-cached
// URL stable.
export async function serveProfileImage(admin: Admin, storagePath: string): Promise<NextResponse> {
  const { data: signed, error } = await admin.storage
    .from(STORAGE_BUCKETS.profileLogos)
    .createSignedUrl(storagePath, SIGNED_URL_TTL.serverFetch);
  if (error || !signed?.signedUrl) return new NextResponse(null, { status: 404 });

  const upstream = await fetch(signed.signedUrl);
  if (!upstream.ok) return new NextResponse(null, { status: 404 });

  return new NextResponse(await upstream.arrayBuffer(), {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600, must-revalidate",
    },
  });
}
