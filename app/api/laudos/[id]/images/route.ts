import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/gemini";

const BUCKET = "laudo-images";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function ensureBucket(admin: ReturnType<typeof getAdmin>) {
  await admin.storage.createBucket(BUCKET, { public: true, upsert: true });
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const withUrls = (images ?? []).map((img) => ({
    ...img,
    url: admin.storage.from(BUCKET).getPublicUrl(img.storage_path).data.publicUrl,
  }));

  return NextResponse.json({ images: withUrls });
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

  const results = [];
  for (const file of files) {
    const ext = file.name.split(".").pop() ?? "jpg";
    const imageId = crypto.randomUUID();
    const storagePath = `${userId}/${id}/${imageId}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, arrayBuffer, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: record, error: dbError } = await admin
      .from("laudo_images")
      .insert({ laudo_id: id, user_id: userId, storage_path: storagePath, file_name: file.name })
      .select()
      .single();

    if (dbError) {
      await admin.storage.from(BUCKET).remove([storagePath]);
      return NextResponse.json({ error: `DB error: ${dbError.message}` }, { status: 500 });
    }

    results.push({
      ...record,
      url: admin.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl,
    });
  }

  return NextResponse.json({ images: results });
}
