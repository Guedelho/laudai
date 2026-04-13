import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/gemini";
import { createAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await createAdmin().from("profiles").select("*").eq("id", userId).single();
  return NextResponse.json(data ?? {});
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { full_name, cpf, signature_font } = body;

  const { data, error } = await createAdmin()
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
