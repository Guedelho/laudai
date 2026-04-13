import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/gemini";
import { createAdmin } from "@/lib/supabase/admin";
import sharp from "sharp";

const BUCKET = "laudo-images";
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 30;

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

async function ensureBucket(admin: ReturnType<typeof createAdmin>) {
  const { error } = await admin.storage.createBucket(BUCKET, { public: false });
  // Ignore "already exists" error
  if (error && !error.message.includes("already exists")) throw error;
}

async function getSignedUrl(admin: ReturnType<typeof createAdmin>, storagePath: string): Promise<string | null> {
  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(storagePath, 7200);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { data: images, error } = await admin
    .from("laudo_images")
    .select("*")
    .eq("laudo_id", id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Laudo images fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar imagens." }, { status: 500 });
  }

  const withUrls = await Promise.all(
    (images ?? []).map(async (img) => ({
      ...img,
      url: await getSignedUrl(admin, img.storage_path),
    }))
  );

  return NextResponse.json({ images: withUrls.filter((img) => img.url !== null) });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();
  await ensureBucket(admin);

  // Verify laudo belongs to user
  const { data: laudo } = await admin
    .from("laudos")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();
  if (!laudo) return NextResponse.json({ error: "Laudo not found" }, { status: 404 });

  const formData = await req.formData();
  const files = formData.getAll("images") as File[];

  if (!files.length) return NextResponse.json({ error: "No images provided" }, { status: 400 });
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Máximo de ${MAX_FILES} imagens por vez` }, { status: 400 });

  // Phase 1: validate + detect formats in parallel
  const fileData = await Promise.all(
    files.map(async (file) => {
      if (file.size > MAX_FILE_SIZE) {
        return { validationError: `Arquivo muito grande (máx 20MB): ${file.name}` } as const;
      }
      const buf = Buffer.from(await file.arrayBuffer());
      const detected = await detectImageFormat(buf);
      if (!detected) {
        return { validationError: `Formato não suportado: ${file.name}. Use JPEG, PNG ou WebP.` } as const;
      }
      return { buf, mime: detected.mime, ext: detected.ext, name: file.name };
    })
  );

  const invalid = fileData.find((d) => "validationError" in d);
  if (invalid && "validationError" in invalid) {
    return NextResponse.json({ error: invalid.validationError }, { status: 400 });
  }

  // Phase 2: upload + insert in parallel
  const validFiles = fileData as Array<{ buf: Buffer; mime: string; ext: string; name: string }>;
  try {
    const results = await Promise.all(
      validFiles.map(async ({ buf, mime, ext, name }) => {
        const imageId = crypto.randomUUID();
        const storagePath = `${userId}/${id}/${imageId}.${ext}`;

        const { error: uploadError } = await admin.storage
          .from(BUCKET)
          .upload(storagePath, buf, { contentType: mime });

        if (uploadError) {
          console.error("Image upload error:", uploadError);
          throw new Error("Erro ao enviar imagem.");
        }

        const { data: record, error: dbError } = await admin
          .from("laudo_images")
          .insert({ laudo_id: id, user_id: userId, storage_path: storagePath, file_name: name })
          .select()
          .single();

        if (dbError) {
          console.error("Image DB insert error:", dbError);
          await admin.storage.from(BUCKET).remove([storagePath]);
          throw new Error("Erro ao registrar imagem.");
        }

        return { ...record, url: await getSignedUrl(admin, storagePath) };
      })
    );

    return NextResponse.json({ images: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro ao processar imagens.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
