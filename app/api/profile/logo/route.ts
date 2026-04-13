import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/gemini";
import { createAdmin } from "@/lib/supabase/admin";
import sharp from "sharp";

const BUCKET = "profile-logos";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FORMATS = new Set(["jpeg", "png"]);

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;

  if (!file) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Arquivo muito grande. Máximo 5 MB." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  let format: string | undefined;
  try {
    ({ format } = await sharp(buf).metadata());
  } catch { /* handled below */ }
  if (!format || !ALLOWED_FORMATS.has(format)) {
    return NextResponse.json({ error: "Formato inválido. Use JPEG ou PNG." }, { status: 400 });
  }

  const ext = format === "jpeg" ? "jpg" : format;
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const storagePath = `${userId}/logo.${ext}`;

  const { error: uploadError } = await createAdmin()
    .storage
    .from(BUCKET)
    .upload(storagePath, buf, {
      contentType: mime,
      upsert: true,
    });

  if (uploadError) {
    console.error("Logo upload error:", uploadError);
    return NextResponse.json({ error: "Erro ao enviar logo." }, { status: 500 });
  }

  const { data: { publicUrl } } = createAdmin().storage.from(BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await createAdmin()
    .from("profiles")
    .update({ logo_url: publicUrl })
    .eq("id", userId);

  if (updateError) {
    console.error("Profile logo_url update error:", updateError);
    return NextResponse.json({ error: "Erro ao salvar logo no perfil." }, { status: 500 });
  }

  return NextResponse.json({ logo_url: publicUrl });
}
