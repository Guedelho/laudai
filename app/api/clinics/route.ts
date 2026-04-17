import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();
  const { data: clinics, error } = await admin
    .from("clinics")
    .select("*, clinic_vets(*)")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) {
    console.error("Clinics fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar clínicas." }, { status: 500 });
  }
  return NextResponse.json({ clinics });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, vetName } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome da clínica é obrigatório" }, { status: 400 });

  const admin = createAdmin();

  // Find or create clinic (case-insensitive dedup)
  const { data: existing } = await admin
    .from("clinics")
    .select("*, clinic_vets(*)")
    .eq("user_id", userId)
    .ilike("name", name.trim())
    .maybeSingle();

  if (existing) return NextResponse.json({ clinic: existing });

  const { data: clinic, error } = await admin
    .from("clinics")
    .insert({ user_id: userId, name: name.trim() })
    .select()
    .single();

  if (error) {
    console.error("Clinic create error:", error);
    return NextResponse.json({ error: "Erro ao criar clínica." }, { status: 500 });
  }

  let vet = null;
  if (vetName?.trim()) {
    const { data } = await admin
      .from("clinic_vets")
      .insert({ clinic_id: clinic.id, user_id: userId, name: vetName.trim() })
      .select()
      .single();
    vet = data;
  }

  return NextResponse.json({ clinic: { ...clinic, clinic_vets: vet ? [vet] : [] } });
}
