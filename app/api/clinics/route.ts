import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { findOrCreateClinic, findOrCreateVet } from "@/lib/supabase/db";
import { withApiHandler } from "@/lib/api-handler";

export const GET = withApiHandler({}, async ({ userId }) => {
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
});

export const POST = withApiHandler({}, async ({ userId, req }) => {
  const { name, vetName } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome da clínica é obrigatório" }, { status: 400 });

  const admin = createAdmin();
  const clinic = await findOrCreateClinic(admin, userId, name.trim());

  let vet = null;
  if (vetName?.trim()) {
    vet = await findOrCreateVet(admin, clinic.id, userId, vetName.trim());
  }

  return NextResponse.json({ clinic: { ...clinic, clinic_vets: vet ? [vet] : clinic.clinic_vets } });
});
