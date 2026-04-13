import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/gemini";

const BUCKET = "profile-logos";
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;

  if (!file) return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ error: "Formato inválido. Use JPEG, PNG ou WebP." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "Arquivo muito grande. Máximo 5 MB." }, { status: 400 });

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const storagePath = `${userId}/logo.${ext}`;

  const { error: uploadError } = await admin()
    .storage
    .from(BUCKET)
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Logo upload error:", uploadError);
    return NextResponse.json({ error: "Erro ao enviar logo." }, { status: 500 });
  }

  const { data: { publicUrl } } = admin().storage.from(BUCKET).getPublicUrl(storagePath);

  const { error: updateError } = await admin()
    .from("profiles")
    .update({ logo_url: publicUrl })
    .eq("id", userId);

  if (updateError) {
    console.error("Profile logo_url update error:", updateError);
    return NextResponse.json({ error: "Erro ao salvar logo no perfil." }, { status: 500 });
  }

  return NextResponse.json({ logo_url: publicUrl });
}
