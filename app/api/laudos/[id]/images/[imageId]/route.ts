import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";

const BUCKET = "laudo-images";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const { id, imageId } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { data: image } = await admin
    .from("laudo_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("laudo_id", id)
    .eq("user_id", userId)
    .single();

  if (!image) return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });

  await admin.storage.from(BUCKET).remove([image.storage_path]);

  const { error } = await admin.from("laudo_images").delete().eq("id", imageId).eq("user_id", userId);
  if (error) {
    console.error("Image delete error:", error);
    return NextResponse.json({ error: "Erro ao remover imagem." }, { status: 500 });
  }

  await admin.from("laudos").update({ pdf_storage_path: null }).eq("id", id).eq("user_id", userId);
  return NextResponse.json({ success: true });
}
