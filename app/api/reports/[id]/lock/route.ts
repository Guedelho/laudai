import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getUserId } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { error } = await admin
    .from("reports")
    .update({ locked_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId)
    .is("locked_at", null);

  if (error) {
    console.error("Lock error:", error);
    return NextResponse.json({ error: "Erro ao bloquear laudo." }, { status: 500 });
  }

  revalidateTag(`report-${id}`, "default");
  return NextResponse.json({ ok: true });
}
