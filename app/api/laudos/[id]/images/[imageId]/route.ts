import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getUserId } from "@/lib/gemini";
import { createAdmin } from "@/lib/supabase/admin";

const BUCKET = "laudo-images";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const { id, imageId } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createAdmin();

  const { data: image, error: fetchError } = await admin
    .from("laudo_images")
    .select("*")
    .eq("id", imageId)
    .eq("laudo_id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  await admin.storage.from(BUCKET).remove([image.storage_path]);

  const { error } = await admin.from("laudo_images").delete().eq("id", imageId);
  if (error) {
    console.error("Image delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir imagem." }, { status: 500 });
  }

  revalidateTag(`laudo-${id}`, "default");
  return NextResponse.json({ ok: true });
}
