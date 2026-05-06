import "server-only";

import sharp from "sharp";
import { MAX_IMAGE_FILE_SIZE } from "@/shared/constants";

// ─── Profile image validation ───────────────────────────────────────────────

const ALLOWED_FORMATS = new Set(["jpeg", "png"]);

type ImageError = { ok: false; status: number; error: string };
type ImageOk = { ok: true; buf: Buffer; ext: string; mime: string };

export async function parseProfileImage(file: File | null): Promise<ImageError | ImageOk> {
  if (!file) return { ok: false, status: 400, error: "Arquivo não enviado." };
  if (file.size > MAX_IMAGE_FILE_SIZE) return { ok: false, status: 400, error: "Arquivo muito grande. Máximo 5 MB." };

  const buf = Buffer.from(await file.arrayBuffer());
  let format: string | undefined;
  try {
    ({ format } = await sharp(buf).metadata());
  } catch {
    /* handled below */
  }
  if (!format || !ALLOWED_FORMATS.has(format)) {
    return { ok: false, status: 400, error: "Formato inválido. Use JPEG ou PNG." };
  }

  const ext = format === "jpeg" ? "jpg" : format;
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  return { ok: true, buf, ext, mime };
}

// ─── Rate limiting ──────────────────────────────────────────────────────────

const buckets = new Map<string, Map<string, number[]>>();

function getBucket(name: string): Map<string, number[]> {
  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = new Map();
    buckets.set(name, bucket);
  }
  return bucket;
}

export function checkRateLimit(name: string, userId: string, maxPerMinute: number): boolean {
  const bucket = getBucket(name);
  const now = Date.now();
  const timestamps = (bucket.get(userId) ?? []).filter((t) => now - t < 60_000);
  bucket.set(userId, timestamps);
  return timestamps.length < maxPerMinute;
}

export function recordRateLimit(name: string, userId: string): void {
  const bucket = getBucket(name);
  const now = Date.now();
  const timestamps = (bucket.get(userId) ?? []).filter((t) => now - t < 60_000);
  timestamps.push(now);
  bucket.set(userId, timestamps);
}
