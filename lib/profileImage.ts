import "server-only";

import sharp from "sharp";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_FORMATS = new Set(["jpeg", "png"]);

type ImageError = { ok: false; status: number; error: string };
type ImageOk = { ok: true; buf: Buffer; ext: string; mime: string };

export async function parseProfileImage(file: File | null): Promise<ImageError | ImageOk> {
  if (!file) return { ok: false, status: 400, error: "Arquivo não enviado." };
  if (file.size > MAX_SIZE) return { ok: false, status: 400, error: "Arquivo muito grande. Máximo 5 MB." };

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
