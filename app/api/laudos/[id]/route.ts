import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getUserId } from "@/lib/gemini";
import { ParsedLaudo } from "@/types";

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = getAdmin();

  const { data: existing } = await admin
    .from("laudos")
    .select("id")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!existing) return NextResponse.json({ error: "Laudo not found" }, { status: 404 });

  const body: { generatedContent: ParsedLaudo; patientFields: Record<string, unknown> } = await req.json();
  const { generatedContent, patientFields } = body;

  const { data: updated, error } = await admin
    .from("laudos")
    .update({
      generated_content: JSON.stringify(generatedContent),
      ...patientFields,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: `DB error: ${error.message}` }, { status: 500 });

  return NextResponse.json({ laudo: updated });
}
