import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { parseProfileImage } from "@/lib/profileImage";

const BUCKET = "profile-logos";

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
  const result = await parseProfileImage(formData.get("signature") as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { buf, ext, mime } = result;
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
