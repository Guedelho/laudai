import { NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/auth";
import { parseReportContent } from "@/lib/utils";
import { generatePdfBuffer } from "@/lib/report/pdf";
import { PdfData } from "@/shared/interfaces";
import { ReportType } from "@/shared/models";
import { SPECIALTIES } from "@/lib/report/templates";
import { withApiHandler } from "@/lib/api-handler";
import { PDF_CACHE_TTL_MS, SIGNED_URL_TTL, STORAGE_BUCKETS, TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";
import sharp from "sharp";

const IMAGES_BUCKET = STORAGE_BUCKETS.reportImages;
const PDF_BUCKET = STORAGE_BUCKETS.reportPdfs;
const SUPPORTED_MIME = new Set(["image/jpeg", "image/jpg", "image/png"]);

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);
}

async function fetchAsBase64(url: string, maxWidth?: number, maxHeight?: number): Promise<string> {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  let buf = Buffer.from(arrayBuffer);
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const mime = contentType.split(";")[0].trim();

  const needsConvert = !SUPPORTED_MIME.has(mime) || maxWidth || maxHeight;
  if (needsConvert) {
    let s = sharp(buf);
    if (maxWidth || maxHeight) {
      s = s.resize(maxWidth ?? null, maxHeight ?? null, { fit: "inside" });
    }
    buf = Buffer.from(await s.jpeg({ quality: 85 }).toBuffer());
  }

  const finalMime = needsConvert ? "image/jpeg" : mime;
  return `data:${finalMime};base64,${buf.toString("base64")}`;
}

function buildFilename(report: {
  patient_name: string;
  owner_name: string;
  specialty: string;
  exam_date?: string;
  created_at: string;
}) {
  const dateSource = report.exam_date ? new Date(report.exam_date + "T12:00:00") : new Date(report.created_at);
  const dateShort = [
    String(dateSource.getDate()).padStart(2, "0"),
    String(dateSource.getMonth() + 1).padStart(2, "0"),
    String(dateSource.getFullYear()).slice(2),
  ].join(".");
  return (
    [
      "Laudo",
      SPECIALTIES[report.specialty as ReportType].abbr,
      slugify(report.patient_name),
      slugify(report.owner_name),
      dateShort,
    ].join(".") + ".pdf"
  );
}

export const GET = withApiHandler<{ id: string }>(
  async ({ userId, orgId, admin, params }) => {
    const id = params.id;

    const { data: report } = await admin
      .from(TABLES.reports)
      .select(
        "user_id, patient_name, species, breed, age, sex, neutered, owner_name, clinic_name, responsible_vet, specialty, exam_date, created_at, edited_content, pdf_storage_path, pdf_cached_at",
      )
      .eq("id", id)
      .eq("org_id", orgId)
      .single();

    if (!report) return NextResponse.json({ error: "Laudo não encontrado." }, { status: 404 });

    const pdfAuthorUserId = report.user_id;

    const filename = buildFilename(report);

    const cacheFresh = report.pdf_cached_at && Date.now() - new Date(report.pdf_cached_at).getTime() < PDF_CACHE_TTL_MS;

    if (report.pdf_storage_path && cacheFresh) {
      try {
        const { data: signed } = await admin.storage
          .from(PDF_BUCKET)
          .createSignedUrl(report.pdf_storage_path, SIGNED_URL_TTL.serverFetch);
        if (signed?.signedUrl) {
          const cached = await fetch(signed.signedUrl);
          if (cached.ok) {
            return new NextResponse(await cached.arrayBuffer(), {
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `inline; filename="${filename}"`,
                "Cache-Control": "no-store",
              },
            });
          }
        }
      } catch {
        // Cache miss — regenerate below
      }
    }

    const profile = await getProfile(pdfAuthorUserId);
    if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 400 });

    const { data: rawImages } = await admin
      .from(TABLES.report_images)
      .select("storage_path")
      .eq("report_id", id)
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });

    const specialty = report.specialty as ReportType;
    const dateSource = report.exam_date ? new Date(report.exam_date + "T12:00:00") : new Date(report.created_at);
    const date = dateSource.toLocaleDateString("pt-BR");

    const imageResults = await Promise.all(
      (rawImages ?? []).map(async (img) => {
        try {
          const { data } = await admin.storage
            .from(IMAGES_BUCKET)
            .createSignedUrl(img.storage_path, SIGNED_URL_TTL.oneShot);
          if (!data) return null;
          return await fetchAsBase64(data.signedUrl);
        } catch (err) {
          logError("Failed to load report image", err, { storagePath: img.storage_path });
          return null;
        }
      }),
    );

    const imageBase64List = imageResults.filter((b): b is string => b !== null);

    let logoBase64: string | undefined;
    if (profile.logo_url) {
      try {
        const { data: logoSigned } = await admin.storage
          .from(STORAGE_BUCKETS.profileLogos)
          .createSignedUrl(profile.logo_url, SIGNED_URL_TTL.oneShot);
        if (logoSigned?.signedUrl) logoBase64 = await fetchAsBase64(logoSigned.signedUrl);
      } catch (err) {
        logError("Failed to fetch user logo", err, { userId: pdfAuthorUserId });
      }
    }

    let signatureImageBase64: string | undefined;
    if (profile.signature_image_url) {
      try {
        const { data: sigSigned } = await admin.storage
          .from(STORAGE_BUCKETS.profileLogos)
          .createSignedUrl(profile.signature_image_url, SIGNED_URL_TTL.oneShot);
        if (sigSigned?.signedUrl) signatureImageBase64 = await fetchAsBase64(sigSigned.signedUrl);
      } catch (err) {
        logError("Failed to fetch signature image", err, { userId });
      }
    }

    const pdfData: PdfData = {
      patientName: report.patient_name,
      species: report.species,
      breed: report.breed,
      age: report.age,
      ownerName: report.owner_name,
      sex: report.sex,
      neutered: report.neutered,
      clinicName: report.clinic_name,
      responsibleVet: report.responsible_vet,
      date,
      reportTitle: SPECIALTIES[specialty].reportTitle,
      vetName: profile.full_name,
      signatureText: profile.signature || profile.full_name,
      crmv: profile.crmv,
      parsedReport: parseReportContent(report.edited_content),
      imageBase64List,
      logoBase64,
      signatureFont: profile.signature_font,
      signatureImageBase64,
      crmvState: profile.crmv_state,
    };

    const buffer = await generatePdfBuffer(pdfData);

    const storagePath = `${pdfAuthorUserId}/${id}/${filename}`;
    try {
      await admin.storage.from(PDF_BUCKET).upload(storagePath, Buffer.from(buffer), {
        contentType: "application/pdf",
        upsert: true,
      });
      await admin
        .from(TABLES.reports)
        .update({ pdf_storage_path: storagePath, pdf_cached_at: new Date().toISOString() })
        .eq("id", id)
        .eq("org_id", orgId);
    } catch (err) {
      logError("Failed to cache PDF", err, { userId, reportId: params.id });
    }

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  },
  { botId: false },
);
