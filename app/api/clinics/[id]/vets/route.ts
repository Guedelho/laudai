import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/gemini";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: clinicId } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const admin = getAdmin();

  // Verify clinic belongs to user
  const { data: clinic } = await admin
    .from("clinics")
    .select("id")
    .eq("id", clinicId)
    .eq("user_id", userId)
    .single();
  if (!clinic) return NextResponse.json({ error: "Clínica não encontrada" }, { status: 404 });

  const { data: vet, error } = await admin
    .from("clinic_vets")
    .insert({ clinic_id: clinicId, user_id: userId, name: name.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ vet });
}
