import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { Report } from "@/shared/models";
import ReportDetail from "./ReportDetail";

const BUCKET = "report-images";

function getReportData(id: string, userId: string) {
  return unstable_cache(
    async () => {
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
            const { data } = await admin.storage.from(BUCKET).createSignedUrl(img.storage_path, 7200);
            if (!data) return null;
            return { id: img.id, file_name: img.file_name, url: data.signedUrl };
          }),
        )
      ).filter((img): img is { id: string; file_name: string; url: string } => img !== null);

      return { report, images };
    },
    [`report-${id}-${userId}`],
    { tags: [`report-${id}`], revalidate: 7200 },
  )();
}

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ review?: string }>;
}) {
  const [{ id }, { review }] = await Promise.all([params, searchParams]);

  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const { report, images } = await getReportData(id, user.id);
  if (!report) notFound();

  const isEditing = review === "1";

  return <ReportDetail report={report as Report} images={images} isEditing={isEditing} />;
}
