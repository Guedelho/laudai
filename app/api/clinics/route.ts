import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { findOrCreateClinic, findOrCreateVet } from "@/lib/supabase/db";

export async function GET() {
  const userId = await getUserId();
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
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, vetName } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome da clínica é obrigatório" }, { status: 400 });

  const admin = createAdmin();
  try {
    const clinic = await findOrCreateClinic(admin, userId, name.trim());

    let vet = null;
    if (vetName?.trim()) {
      vet = await findOrCreateVet(admin, clinic.id, userId, vetName.trim());
    }

    return NextResponse.json({ clinic: { ...clinic, clinic_vets: vet ? [vet] : clinic.clinic_vets } });
  } catch (err) {
    console.error("Clinic create error:", err);
    return NextResponse.json({ error: "Erro ao criar clínica." }, { status: 500 });
  }
}
