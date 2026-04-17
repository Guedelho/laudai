import { NextRequest, NextResponse } from "next/server";
import { getUserId, getProfile } from "@/lib/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { parseLaudoContent } from "@/lib/parseLaudo";
import { generatePdfBuffer, PdfData } from "@/lib/generatePdf";
import { Specialty } from "@/types";
import { REPORT_TITLES, SPECIALTY_ABBR } from "@/lib/templates";
import sharp from "sharp";

const pdfRateLimit = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const timestamps = (pdfRateLimit.get(userId) ?? []).filter(t => now - t < 60_000);
  if (timestamps.length >= 5) return false;
  timestamps.push(now);
  pdfRateLimit.set(userId, timestamps);
  return true;
}

const BUCKET = "laudo-images";
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit(userId)) return NextResponse.json({ error: "Muitas requisições. Aguarde um momento." }, { status: 429 });

  const [profile, admin] = [
    await getProfile(userId),
    createAdmin(),
  ];

  const { data: laudo } = await admin
    .from("laudos")
    .select("patient_name, species, breed, age, sex, neutered, owner_name, clinic_name, responsible_vet, specialty, exam_date, created_at, generated_content")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!laudo) return NextResponse.json({ error: "Laudo not found" }, { status: 404 });

  const { data: rawImages } = await admin
    .from("laudo_images")
    .select("storage_path")
    .eq("laudo_id", id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const specialty = laudo.specialty as Specialty;
  const dateSource = laudo.exam_date
    ? new Date(laudo.exam_date + "T12:00:00")
    : new Date(laudo.created_at);
  const date = dateSource.toLocaleDateString("pt-BR");
  const dateShort = [
    String(dateSource.getDate()).padStart(2, "0"),
    String(dateSource.getMonth() + 1).padStart(2, "0"),
    String(dateSource.getFullYear()).slice(2),
  ].join(".");

  // Fetch images and logo in parallel
  const imageResults = await Promise.all(
    (rawImages ?? []).map(async (img) => {
      try {
        const { data } = await admin.storage.from(BUCKET).createSignedUrl(img.storage_path, 60);
        if (!data) return null;
        return await fetchAsBase64(data.signedUrl);
      } catch (err) {
        console.error("Failed to load laudo image:", img.storage_path, err);
        return null;
      }
    })
  );

  const imageBase64List = imageResults.filter((b): b is string => b !== null);
  const imageFailures = imageResults.filter((b) => b === null).length;

  let logoBase64: string | undefined;
  if (profile?.logo_url) {
    try {
      const { data: logoSigned } = await admin.storage
        .from("profile-logos")
        .createSignedUrl(profile.logo_url, 60);
      if (logoSigned?.signedUrl) {
        logoBase64 = await fetchAsBase64(logoSigned.signedUrl);
      }
    } catch (err) {
      console.error("Failed to fetch user logo:", err);
    }
  }

  let signatureImageBase64: string | undefined;
  if (profile?.signature_image_url) {
    try {
      const { data: sigSigned } = await admin.storage
        .from("profile-logos")
        .createSignedUrl(profile.signature_image_url, 60);
      if (sigSigned?.signedUrl) {
        signatureImageBase64 = await fetchAsBase64(sigSigned.signedUrl);
      }
    } catch (err) {
      console.error("Failed to fetch signature image:", err);
    }
  }

  const pdfData: PdfData = {
    patientName: laudo.patient_name,
    species: laudo.species,
    breed: laudo.breed,
    age: laudo.age,
    ownerName: laudo.owner_name,
    sex: laudo.sex ?? undefined,
    neutered: laudo.neutered ?? undefined,
    clinicName: laudo.clinic_name ?? undefined,
    responsibleVet: laudo.responsible_vet ?? undefined,
    date,
    reportTitle: REPORT_TITLES[specialty],
    vetName: profile?.full_name ?? "",
    crmv: profile?.crmv ?? "",
    parsedLaudo: parseLaudoContent(laudo.generated_content),
    imageBase64List,
    logoBase64,
    signatureFont: profile?.signature_font ?? undefined,
    signatureImageBase64,
    crmvState: profile?.crmv_state ?? undefined,
  };

  const buffer = await generatePdfBuffer(pdfData);

  // Filename: Laudo.us.Chico.Juliana.09.03.26.pdf
  const filename = [
    "Laudo",
    SPECIALTY_ABBR[specialty],
    slugify(laudo.patient_name),
    slugify(laudo.owner_name),
    dateShort,
  ].join(".") + ".pdf";

  const responseHeaders: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `inline; filename="${filename}"`,
    "Cache-Control": "no-store",
  };
  if (imageFailures > 0) responseHeaders["X-Image-Failures"] = String(imageFailures);

  return new NextResponse(new Uint8Array(buffer), { headers: responseHeaders });
}
