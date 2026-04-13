import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/gemini";
import { createAdmin } from "@/lib/supabase/admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { error } = await admin
    .from("clinics")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    console.error("Clinic delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir clínica." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
