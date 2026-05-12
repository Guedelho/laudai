import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { createAdmin } from "@/lib/supabase/admin";
import { withApiHandler } from "@/lib/api-handler";
import { reportCacheTag } from "@/lib/utils";
import { logError } from "@/lib/log";

const BUCKET = "report-images";

export const DELETE = withApiHandler<{ id: string; imageId: string }>({}, async ({ userId, params }) => {
  const { id, imageId } = params;
  const admin = createAdmin();

  const { data: image } = await admin
    .from("report_images")
    .select("storage_path")
    .eq("id", imageId)
    .eq("report_id", id)
    .eq("user_id", userId)
    .single();

  if (!image) return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });

  await admin.storage.from(BUCKET).remove([image.storage_path]);

  const { error } = await admin.from("report_images").delete().eq("id", imageId).eq("user_id", userId);
  if (error) {
    logError("Image delete failed", error, { userId, reportId: id, imageId });
    return NextResponse.json({ error: "Erro ao remover imagem." }, { status: 500 });
  }

  await admin.from("reports").update({ pdf_storage_path: null }).eq("id", id).eq("user_id", userId);
  revalidateTag(reportCacheTag(id), "max");
  return NextResponse.json({ success: true });
});
