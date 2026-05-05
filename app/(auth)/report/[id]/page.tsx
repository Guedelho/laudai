import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { cacheTag, cacheLife } from "next/cache";
import { Report } from "@/shared/models";
import { SIGNED_URL_TTL } from "@/shared/constants";
import ReportDetail from "./ReportDetail";
import Loading from "./loading";

const BUCKET = "report-images";

async function getReportData(id: string, userId: string) {
  "use cache";
  cacheTag(`report-${id}`);
  cacheLife({ revalidate: SIGNED_URL_TTL.display, expire: SIGNED_URL_TTL.display });

  const admin = createAdmin();
  const [{ data: report }, { data: rawImages }] = await Promise.all([
    admin.from("reports").select("*").eq("id", id).eq("user_id", userId).is("deleted_at", null).single(),
    admin
      .from("report_images")
      .select("*")
      .eq("report_id", id)
      .eq("user_id", userId)
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
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const { report, images } = await getReportData(id, user.id);
  if (!report) notFound();

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
