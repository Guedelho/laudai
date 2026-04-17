import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { UpdateProfileRequest } from "@/types";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await createAdmin().from("profiles").select("*").eq("id", userId).single();
  return NextResponse.json(data ?? {});
}

export async function PUT(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();
  const body: UpdateProfileRequest = await req.json();
  const { full_name, signature_font, signature_image_url, signature } = body;

  const { data: existing } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();

  const upsertData: Record<string, unknown> = { id: userId, full_name, signature_font, signature };
  if (!existing) {
    upsertData.cpf = body.cpf;
    upsertData.crmv = body.crmv;
    upsertData.crmv_state = body.crmv_state;
  }
  if ("signature_image_url" in body) upsertData.signature_image_url = signature_image_url;

  const { data, error } = await admin.from("profiles").upsert(upsertData, { onConflict: "id" }).select().single();

  if (error) {
    console.error("Profile save error:", error);
    return NextResponse.json({ error: "Erro ao salvar perfil." }, { status: 500 });
  }
  return NextResponse.json(data);
}
