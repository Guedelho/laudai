import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { parseProfileImage } from "@/lib/server-utils";

const BUCKET = "profile-logos";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return new NextResponse(null, { status: 401 });

  const admin = createAdmin();
  const { data: profile } = await admin.from("profiles").select("logo_url").eq("id", userId).single();

  if (!profile?.logo_url) return new NextResponse(null, { status: 404 });

  const { data, error } = await admin.storage.from(BUCKET).createSignedUrl(profile.logo_url, 300);

  if (error || !data?.signedUrl) return new NextResponse(null, { status: 404 });

  return NextResponse.redirect(data.signedUrl);
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const result = await parseProfileImage(formData.get("logo") as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { buf, ext, mime } = result;
  const storagePath = `${userId}/logo.${ext}`;
  const admin = createAdmin();

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mime, upsert: true });

  if (uploadError) {
    console.error("Logo upload error:", uploadError);
    return NextResponse.json({ error: "Erro ao enviar logo." }, { status: 500 });
  }

  const { error: updateError } = await admin.from("profiles").update({ logo_url: storagePath }).eq("id", userId);

  if (updateError) {
    console.error("Profile logo_url update error:", updateError);
    return NextResponse.json({ error: "Erro ao salvar logo no perfil." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
