import { Suspense } from "react";
import { createAdmin } from "@/lib/supabase/admin";
import { getServerUser, getCurrentOrgId } from "@/lib/supabase/auth";
import { notFound } from "next/navigation";
import { cacheTag, cacheLife } from "next/cache";
import { Report } from "@/shared/models";
import { REPORT_STATUSES, SIGNED_URL_TTL, STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { reportCacheTag } from "@/lib/utils";
import ReportDetail from "./ReportDetail";
import PendingReportLive from "./PendingReportLive";
import Loading from "./loading";

const BUCKET = STORAGE_BUCKETS.reportImages;

async function getReportData(id: string, orgId: string) {
  "use cache";
  cacheTag(reportCacheTag(id));
  cacheLife({ revalidate: SIGNED_URL_TTL.display, expire: SIGNED_URL_TTL.display });

  const admin = createAdmin();
  const [{ data: report }, { data: rawImages }] = await Promise.all([
    admin.from(TABLES.reports).select("*").eq("id", id).eq("org_id", orgId).is("deleted_at", null).single(),
    admin
      .from(TABLES.report_images)
      .select("*")
      .eq("report_id", id)
      .eq("org_id", orgId)
      .order("created_at", { ascending: true }),
  ]);

  const images = (
    await Promise.all(
      (rawImages ?? []).map(async (img) => {
        const { data } = await admin.storage.from(BUCKET).createSignedUrl(img.storage_path, SIGNED_URL_TTL.display);
        if (!data) return null;
        return { id: img.id, file_name: img.file_name, url: data.signedUrl };
      }),
    )
  ).filter((img): img is { id: string; file_name: string; url: string } => img !== null);

  return { report, images };
}

async function ReportContents({ id, review }: { id: string; review: boolean }) {
  const user = await getServerUser();
  if (!user) return null;

  const orgId = await getCurrentOrgId(user.id);
  const { report, images } = await getReportData(id, orgId);
  if (!report) notFound();

  if (report.status !== REPORT_STATUSES.completed || !report.edited_content) {
    return <PendingReportLive reportId={id} orgId={orgId} status={report.status} errorMessage={report.error_message} />;
  }

  return <ReportDetail report={report as Report} images={images} isEditing={review} />;
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const [{ id }, { review }] = await Promise.all([params, searchParams]);

  return (
    <Suspense fallback={<Loading />}>
      <ReportContents id={id} review={review === "1"} />
    </Suspense>
  );
}
