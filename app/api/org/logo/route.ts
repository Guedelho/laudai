import { NextResponse } from "next/server";
import { parseProfileImage, serveProfileImage } from "@/lib/images";
import { STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { withApiHandler } from "@/lib/api-handler";
import { invalidateOrgPdfCache } from "@/lib/report/cache";
import { isOrgOwner } from "@/lib/supabase/org";
import { logError } from "@/lib/log";

const BUCKET = STORAGE_BUCKETS.profileLogos;

export const GET = withApiHandler(
  async ({ admin, orgId }) => {
    const { data: org } = await admin.from(TABLES.organizations).select("logo_url").eq("id", orgId).single();
    if (!org?.logo_url) return new NextResponse(null, { status: 404 });
    return serveProfileImage(admin, org.logo_url);
  },
  { botId: false },
);

export const POST = withApiHandler(async ({ userId, orgId, admin, req }) => {
  if (!(await isOrgOwner(admin, userId, orgId))) {
    return NextResponse.json({ error: "Apenas o responsável pela organização pode alterar o logo." }, { status: 403 });
  }

  const formData = await req.formData();
  const result = await parseProfileImage(formData.get("logo") as File | null);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const { buf, ext, mime } = result;
  const storagePath = `${orgId}/logo.${ext}`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(storagePath, buf, { contentType: mime, upsert: true });

  if (uploadError) {
    logError("Org logo upload failed", uploadError, { orgId });
    return NextResponse.json({ error: "Erro ao enviar logo." }, { status: 500 });
  }

  const { error: updateError } = await admin
    .from(TABLES.organizations)
    .update({ logo_url: storagePath })
    .eq("id", orgId);

  if (updateError) {
    logError("Org logo_url update failed", updateError, { orgId });
    return NextResponse.json({ error: "Erro ao salvar logo." }, { status: 500 });
  }

  await invalidateOrgPdfCache(admin, orgId);
  return NextResponse.json({ ok: true });
});

export const DELETE = withApiHandler(async ({ userId, orgId, admin }) => {
  if (!(await isOrgOwner(admin, userId, orgId))) {
    return NextResponse.json({ error: "Apenas o responsável pela organização pode remover o logo." }, { status: 403 });
  }

  const { error } = await admin.from(TABLES.organizations).update({ logo_url: null }).eq("id", orgId);
  if (error) {
    logError("Org logo remove failed", error, { orgId });
    return NextResponse.json({ error: "Erro ao remover logo." }, { status: 500 });
  }

  await invalidateOrgPdfCache(admin, orgId);
  return NextResponse.json({ ok: true });
});
