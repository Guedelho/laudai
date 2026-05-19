import { NextResponse } from "next/server";
import { createAdmin } from "@/lib/supabase/admin";
import { withApiHandler } from "@/lib/api-handler";
import { SIGNED_URL_TTL, STORAGE_BUCKETS, TABLES } from "@/shared/constants";

type Admin = ReturnType<typeof createAdmin>;

async function signed(admin: Admin, bucket: string, path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await admin.storage.from(bucket).createSignedUrl(path, SIGNED_URL_TTL.serverFetch);
  return data?.signedUrl ?? null;
}

export const GET = withApiHandler(async ({ userId }) => {
  const admin = createAdmin();

  const [profileRes, reportsRes, petsRes, clinicsRes, vetsRes, consentsRes, imagesRes] = await Promise.all([
    admin.from(TABLES.profiles).select("*").eq("id", userId).maybeSingle(),
    admin.from(TABLES.reports).select("*").eq("user_id", userId),
    admin.from(TABLES.pets).select("*").eq("user_id", userId),
    admin.from(TABLES.clinics).select("*").eq("user_id", userId),
    admin.from(TABLES.clinic_vets).select("*").eq("user_id", userId),
    admin.from(TABLES.consents).select("*").eq("user_id", userId),
    admin.from(TABLES.report_images).select("*").eq("user_id", userId),
  ]);

  const reportIdToImages = new Map<
    string,
    Array<{ id: string; storage_path: string; file_name: string; signed_url: string | null }>
  >();
  for (const img of imagesRes.data ?? []) {
    const list = reportIdToImages.get(img.report_id) ?? [];
    list.push({
      id: img.id,
      storage_path: img.storage_path,
      file_name: img.file_name,
      signed_url: await signed(admin, STORAGE_BUCKETS.reportImages, img.storage_path),
    });
    reportIdToImages.set(img.report_id, list);
  }

  const reports = await Promise.all(
    (reportsRes.data ?? []).map(async (r) => ({
      ...r,
      pdf_signed_url: await signed(admin, STORAGE_BUCKETS.reportPdfs, r.pdf_storage_path),
      images: reportIdToImages.get(r.id) ?? [],
    })),
  );

  const profile = profileRes.data
    ? {
        ...profileRes.data,
        logo_signed_url: await signed(admin, STORAGE_BUCKETS.profileLogos, profileRes.data.logo_url),
        signature_signed_url: await signed(admin, STORAGE_BUCKETS.profileLogos, profileRes.data.signature_image_url),
      }
    : null;

  const payload = {
    exported_at: new Date().toISOString(),
    user_id: userId,
    profile,
    reports,
    pets: petsRes.data ?? [],
    clinics: clinicsRes.data ?? [],
    clinic_vets: vetsRes.data ?? [],
    consents: consentsRes.data ?? [],
  };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="laudai-export-${userId}-${date}.json"`,
    },
  });
});
