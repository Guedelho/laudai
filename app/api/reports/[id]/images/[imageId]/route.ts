import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { withApiHandler } from "@/lib/api-handler";
import { reportCacheTag } from "@/lib/utils";
import { STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { AUDIT_ACTIONS, AUDIT_ENTITIES } from "@/lib/audit";
import { logError } from "@/lib/log";

const BUCKET = STORAGE_BUCKETS.reportImages;

export const DELETE = withApiHandler<{ id: string; imageId: string }>(async ({ userId, admin, audit, params }) => {
  const { id, imageId } = params;

  const { data: image } = await admin
    .from(TABLES.report_images)
    .select("*")
    .eq("id", imageId)
    .eq("report_id", id)
    .eq("user_id", userId)
    .single();

  if (!image) return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });

  await admin.storage.from(BUCKET).remove([image.storage_path]);

  const { error } = await admin.from(TABLES.report_images).delete().eq("id", imageId).eq("user_id", userId);
  if (error) {
    logError("Image delete failed", error, { userId, reportId: id, imageId });
    return NextResponse.json({ error: "Erro ao remover imagem." }, { status: 500 });
  }

  await admin.from(TABLES.reports).update({ pdf_storage_path: null }).eq("id", id).eq("user_id", userId);
  revalidateTag(reportCacheTag(id), "max");
  await audit({
    action: AUDIT_ACTIONS.delete,
    entityType: AUDIT_ENTITIES.report_image,
    entityId: imageId,
    changes: image,
  });
  return NextResponse.json({ success: true });
});
