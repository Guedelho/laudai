import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import sharp from "sharp";

const BUCKET = "profile-logos";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_FORMATS = new Set(["jpeg", "png"]);

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return new NextResponse(null, { status: 401 });

  const admin = createAdmin();
  const { data: profile } = await admin.from("profiles").select("signature_image_url").eq("id", userId).single();

  if (!profile?.signature_image_url) return new NextResponse(null, { status: 404 });

  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(profile.signature_image_url, 300);

  if (error || !data?.signedUrl) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(data.signedUrl);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("signature") as File | null;

  if (!file) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Arquivo muito grande. Máximo 5 MB." }, { status: 400 });

  const buf = Buffer.from(await file.arrayBuffer());
  let format: string | undefined;
  try {
    ({ format } = await sharp(buf).metadata());
  } catch {
    /* handled below */
  }
  if (!format || !ALLOWED_FORMATS.has(format)) {
    return NextResponse.json({ error: "Formato inválido. Use JPEG ou PNG." }, { status: 400 });
  }

  const ext = format === "jpeg" ? "jpg" : format;
  const mime = format === "jpeg" ? "image/jpeg" : "image/png";
  const storagePath = `${userId}/signature.${ext}`;
  const admin = createAdmin();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mime, upsert: true });

  if (uploadError) {
    console.error("Signature upload error:", uploadError);
    return NextResponse.json({ error: "Erro ao enviar imagem de assinatura." }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ signature_image_url: storagePath, signature_font: null })
    .eq("id", userId);

  if (updateError) {
    console.error("Profile signature_image_url update error:", updateError);
    return NextResponse.json({ error: "Erro ao salvar assinatura no perfil." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();
  const { error } = await admin.from("profiles").update({ signature_image_url: null }).eq("id", userId);

  if (error) {
    console.error("Signature remove error:", error);
    return NextResponse.json({ error: "Erro ao remover assinatura." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
