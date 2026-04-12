import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/gemini";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await admin().from("profiles").select("*").eq("id", userId).single();
  return NextResponse.json(data ?? {});
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { full_name, cpf, signature_font } = body;

  const { data, error } = await admin()
    .from("profiles")
    .upsert({ id: userId, full_name, cpf, signature_font }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("Profile save error:", error);
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }
  return NextResponse.json(data);
}
