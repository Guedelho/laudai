import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { generateLaudo, getUserId } from "@/lib/gemini";
import { GenerateRequest } from "@/types";

export async function POST(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const body: GenerateRequest = await req.json();
  const { specialty, rawInput, patientName, species, breed, age, ownerName, veterinarian, crmv } = body;

  let generatedContent: string;
  try {
    generatedContent = await generateLaudo({ specialty, rawInput, patientName, species, breed, age, ownerName, veterinarian, crmv });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Gemini error: ${message}` }, { status: 500 });
  }

  const { data: laudo, error } = await supabase
    .from("laudos")
    .insert({ user_id: userId, specialty, patient_name: patientName, species, breed, age, owner_name: ownerName, raw_input: rawInput, generated_content: generatedContent })
    .select()
    .single();

  if (error) return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 });

  return NextResponse.json({ laudo });
}
