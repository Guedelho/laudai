import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { reportCacheTag } from "@/lib/utils";
import { createAdmin } from "@/lib/supabase/admin";
import { MAX_REPORT_IMAGES, MAX_IMAGE_FILE_SIZE, SIGNED_URL_TTL } from "@/shared/constants";
import { withApiHandler } from "@/lib/api-handler";
import { logError } from "@/lib/log";
import sharp from "sharp";

const BUCKET = "report-images";

const SHARP_FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
const ALLOWED_FORMATS = new Set(["jpeg", "png", "webp"]);

async function detectImageFormat(buf: Buffer): Promise<{ mime: string; ext: string } | null> {
  try {
    const { format } = await sharp(buf).metadata();
    if (!format || !ALLOWED_FORMATS.has(format)) return null;
    return { mime: SHARP_FORMAT_TO_MIME[format] ?? "image/jpeg", ext: format === "jpeg" ? "jpg" : format };
  } catch {
    return null;
  }
}

async function getSignedUrl(admin: ReturnType<typeof createAdmin>, storagePath: string): Promise<string | null> {
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, SIGNED_URL_TTL.display);
  if (error || !data) return null;
  return data.signedUrl;
}

export const GET = withApiHandler<{ id: string }>({}, async ({ userId, params }) => {
  const id = params.id;
  const admin = createAdmin();

  const { data: images, error } = await admin
    .from("report_images")
    .select("*")
    .eq("report_id", id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    logError("Report images fetch failed", error, { userId, reportId: params.id });
    return NextResponse.json({ error: "Erro ao buscar imagens." }, { status: 500 });
  }

  const withUrls = await Promise.all(
    (images ?? []).map(async (img) => ({
      ...img,
      url: await getSignedUrl(admin, img.storage_path),
    })),
  );

  return NextResponse.json({ images: withUrls.filter((img) => img.url !== null) });
});

export const POST = withApiHandler<{ id: string }>({ botId: true }, async ({ userId, req, params }) => {
  const id = params.id;
  const admin = createAdmin();

  const { data: report } = await admin.from("reports").select("id").eq("id", id).eq("user_id", userId).single();
  if (!report) return NextResponse.json({ error: "Laudo não encontrado." }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("images") as File[];

  if (!files.length) return NextResponse.json({ error: "No images provided" }, { status: 400 });

  // Total-per-report cap, not just per-request: count what's already there
  // and reject if this batch would push the report over the limit.
  const { count: existingCount } = await admin
    .from("report_images")
    .select("*", { count: "exact", head: true })
    .eq("report_id", id)
    .eq("user_id", userId);

  if ((existingCount ?? 0) + files.length > MAX_REPORT_IMAGES) {
    return NextResponse.json(
      { error: `Limite de ${MAX_REPORT_IMAGES} imagens por laudo. Atual: ${existingCount ?? 0}.` },
      { status: 400 },
    );
  }

  const fileData = await Promise.all(
    files.map(async (file) => {
      if (file.size > MAX_IMAGE_FILE_SIZE) {
        return { validationError: `Arquivo muito grande (máx 5MB): ${file.name}` } as const;
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const detected = await detectImageFormat(buf);
      if (!detected) {
        return { validationError: `Formato não suportado: ${file.name}. Use JPEG, PNG ou WebP.` } as const;
      }
      return { buf, mime: detected.mime, ext: detected.ext, name: file.name };
    }),
  );

  const invalid = fileData.find((d) => "validationError" in d);
  if (invalid && "validationError" in invalid) {
    return NextResponse.json({ error: invalid.validationError }, { status: 400 });
  }

  const validFiles = fileData as Array<{ buf: Buffer; mime: string; ext: string; name: string }>;
  const results = await Promise.all(
    validFiles.map(async ({ buf, mime, ext, name }) => {
      const imageId = crypto.randomUUID();
      const storagePath = `${userId}/${id}/${imageId}.${ext}`;

      const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, buf, { contentType: mime });
      if (uploadError) {
        logError("Image upload failed", uploadError, { userId, reportId: params.id });
        throw new Error("Erro ao enviar imagem.");
      }

      const { data: record, error: dbError } = await admin
        .from("report_images")
        .insert({ report_id: id, user_id: userId, storage_path: storagePath, file_name: name })
        .select()
        .single();

      if (dbError) {
        logError("Image DB insert failed", dbError, { userId, reportId: params.id });
        await admin.storage.from(BUCKET).remove([storagePath]);
        throw new Error("Erro ao registrar imagem.");
      }

      return { ...record, url: await getSignedUrl(admin, storagePath) };
    }),
  );

  revalidateTag(reportCacheTag(id), "max");
  await admin.from("reports").update({ pdf_storage_path: null }).eq("id", id).eq("user_id", userId);
  return NextResponse.json({ images: results });
});
