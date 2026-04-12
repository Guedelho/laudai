import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/gemini";

const BUCKET = "laudo-images";
const ALLOWED_TYPES = ["image/jpeg", "image/png"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const MAX_FILES = 10;

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function ensureBucket(admin: ReturnType<typeof getAdmin>) {
  const { error } = await admin.storage.createBucket(BUCKET, { public: false });
  // Ignore "already exists" error
  if (error && !error.message.includes("already exists")) throw error;
}

async function getSignedUrl(admin: ReturnType<typeof getAdmin>, storagePath: string): Promise<string | null> {
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

  const admin = getAdmin();

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

  const admin = getAdmin();
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

  const results = [];
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Tipo de arquivo não permitido: ${file.type}` }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: `Arquivo muito grande (máx 20MB): ${file.name}` }, { status: 400 });
    }

    const ext = file.type === "image/png" ? "png" : "jpg";
    const imageId = crypto.randomUUID();
    const storagePath = `${userId}/${id}/${imageId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, { contentType: file.type });

    if (uploadError) {
      console.error("Image upload error:", uploadError);
      return NextResponse.json({ error: "Erro ao enviar imagem." }, { status: 500 });
    }

    const { data: record, error: dbError } = await admin
      .from("laudo_images")
      .insert({ laudo_id: id, user_id: userId, storage_path: storagePath, file_name: file.name })
      .select()
      .single();

    if (dbError) {
      console.error("Image DB insert error:", dbError);
      await admin.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: "Erro ao registrar imagem." }, { status: 500 });
    }

    results.push({
      ...record,
      url: await getSignedUrl(admin, storagePath),
    });
  }

  return NextResponse.json({ images: results });
}
