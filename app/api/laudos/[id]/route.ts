import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getUserId } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { UpdateLaudoRequest } from "@/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();
  const { generatedContent, patientFields }: UpdateLaudoRequest = await req.json();

  const { data: updated, error } = await admin
    .from("laudos")
    .update({
      edited_content: JSON.stringify(generatedContent),
      ...patientFields,
      pdf_storage_path: null,
    })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    console.error("Laudo update error:", error);
    return NextResponse.json({ error: "Laudo not found" }, { status: 404 });
  }

  revalidateTag(`laudo-${id}`, "default");
  return NextResponse.json({ laudo: updated });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { error } = await admin
    .from("laudos")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Laudo delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir laudo." }, { status: 500 });
  }

  revalidateTag(`laudo-${id}`, "default");
  return NextResponse.json({ ok: true });
}
