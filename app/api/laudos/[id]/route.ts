import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getUserId } from "@/lib/gemini";
import { createAdmin } from "@/lib/supabase/admin";
import { ParsedLaudo } from "@/types";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

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

  if (error) {
    console.error("Laudo update error:", error);
    return NextResponse.json({ error: "Erro ao salvar laudo." }, { status: 500 });
  }

  revalidateTag(`laudo-${id}`, "default");
  return NextResponse.json({ laudo: updated });
}
