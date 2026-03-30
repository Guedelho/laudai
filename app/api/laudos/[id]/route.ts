import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { generateLaudo, getUserId } from "@/lib/gemini";
import { Specialty } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: existing } = await supabase
    .from("laudos")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!existing) return NextResponse.json({ error: "Laudo not found" }, { status: 404 });

  const { rawInput } = await req.json();

  const vetMatch = existing.generated_content.match(/Médico Veterinário:\s*(.+?)\s*\|\s*CRMV:\s*(.+)/);

  let generatedContent: string;
  try {
    generatedContent = await generateLaudo({
      specialty: existing.specialty as Specialty,
      rawInput,
      patientName: existing.patient_name,
      species: existing.species,
      breed: existing.breed,
      age: existing.age,
      ownerName: existing.owner_name,
      veterinarian: vetMatch?.[1]?.trim() ?? "",
      crmv: vetMatch?.[2]?.trim() ?? "",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Gemini error: ${message}` }, { status: 500 });
  }

  const { data: updated, error } = await supabase
    .from("laudos")
    .update({ raw_input: rawInput, generated_content: generatedContent })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 });

  return NextResponse.json({ laudo: updated });
}
