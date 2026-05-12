import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { findOrCreateVet } from "@/lib/supabase/db";
import { withApiHandler } from "@/lib/api-handler";
import { ClinicVetRequest } from "@/shared/interfaces";

export const POST = withApiHandler<{ id: string }>({}, async ({ userId, req, params }) => {
  const clinicId = params.id;
  const { name }: ClinicVetRequest = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const admin = createAdmin();
  const { data: clinic } = await admin.from("clinics").select("id").eq("id", clinicId).eq("user_id", userId).single();
  if (!clinic) return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });

  const vet = await findOrCreateVet(admin, clinicId, userId, name.trim());
  return NextResponse.json({ vet });
});
