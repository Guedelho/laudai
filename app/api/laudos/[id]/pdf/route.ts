import { NextRequest, NextResponse } from "next/server";
import { getUserId, getProfile } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { parseLaudoContent } from "@/lib/utils";
import { generatePdfBuffer } from "@/lib/laudo/pdf";
import { PdfData } from "@/shared/interfaces";
import { Specialty } from "@/shared/models";
import { SPECIALTIES } from "@/lib/laudo/templates";
import { checkRateLimit, recordRateLimit } from "@/lib/server-utils";
import sharp from "sharp";

const IMAGES_BUCKET = "laudo-images";
const PDF_BUCKET = "laudo-pdfs";
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

function buildFilename(laudo: {
  patient_name: string;
  owner_name: string;
  specialty: string;
  exam_date?: string;
  created_at: string;
}) {
  const dateSource = laudo.exam_date ? new Date(laudo.exam_date + "T12:00:00") : new Date(laudo.created_at);
  const dateShort = [
    String(dateSource.getDate()).padStart(2, "0"),
    String(dateSource.getMonth() + 1).padStart(2, "0"),
    String(dateSource.getFullYear()).slice(2),
  ].join(".");
  return (
    [
      "Laudo",
      SPECIALTIES[laudo.specialty as Specialty].abbr,
      slugify(laudo.patient_name),
      slugify(laudo.owner_name),
      dateShort,
    ].join(".") + ".pdf"
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!checkRateLimit("pdf", userId, 5))
    return NextResponse.json({ error: "Muitas requisições. Aguarde um momento." }, { status: 429 });
  recordRateLimit("pdf", userId);

  const admin = createAdmin();

  const { data: laudo } = await admin
    .from("laudos")
    .select(
      "patient_name, species, breed, age, sex, neutered, owner_name, clinic_name, responsible_vet, specialty, exam_date, created_at, edited_content, pdf_storage_path",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (!laudo) return NextResponse.json({ error: "Laudo not found" }, { status: 404 });

  const filename = buildFilename(laudo);

  // Serve cached PDF if available
  if (laudo.pdf_storage_path) {
    try {
      const { data: signed } = await admin.storage.from(PDF_BUCKET).createSignedUrl(laudo.pdf_storage_path, 300);
      if (signed?.signedUrl) {
        const cached = await fetch(signed.signedUrl);
        if (cached.ok) {
          return new NextResponse(await cached.arrayBuffer(), {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `inline; filename="${filename}"`,
              "Cache-Control": "private, max-age=300",
            },
          });
        }
      }
    } catch {
      // Cache miss — regenerate below
    }
  }

  // Generate PDF
  const profile = await getProfile(userId);
  if (!profile) return NextResponse.json({ error: "Perfil não encontrado." }, { status: 400 });

  const { data: rawImages } = await admin
    .from("laudo_images")
    .select("storage_path")
    .eq("laudo_id", id)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const specialty = laudo.specialty as Specialty;
  const dateSource = laudo.exam_date ? new Date(laudo.exam_date + "T12:00:00") : new Date(laudo.created_at);
  const date = dateSource.toLocaleDateString("pt-BR");

  const imageResults = await Promise.all(
    (rawImages ?? []).map(async (img) => {
      try {
        const { data } = await admin.storage.from(IMAGES_BUCKET).createSignedUrl(img.storage_path, 60);
        if (!data) return null;
        return await fetchAsBase64(data.signedUrl);
      } catch (err) {
        console.error("Failed to load laudo image:", img.storage_path, err);
        return null;
      }
    }),
  );

  const imageBase64List = imageResults.filter((b): b is string => b !== null);

  let logoBase64: string | undefined;
  if (profile.logo_url) {
    try {
      const { data: logoSigned } = await admin.storage.from("profile-logos").createSignedUrl(profile.logo_url, 60);
      if (logoSigned?.signedUrl) logoBase64 = await fetchAsBase64(logoSigned.signedUrl);
    } catch (err) {
      console.error("Failed to fetch user logo:", err);
    }
  }

  let signatureImageBase64: string | undefined;
  if (profile.signature_image_url) {
    try {
      const { data: sigSigned } = await admin.storage
        .from("profile-logos")
        .createSignedUrl(profile.signature_image_url, 60);
      if (sigSigned?.signedUrl) signatureImageBase64 = await fetchAsBase64(sigSigned.signedUrl);
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
    sex: laudo.sex,
    neutered: laudo.neutered,
    clinicName: laudo.clinic_name,
    responsibleVet: laudo.responsible_vet,
    date,
    reportTitle: SPECIALTIES[specialty].reportTitle,
    vetName: profile.full_name,
    signatureText: profile.signature || profile.full_name,
    crmv: profile.crmv,
    parsedLaudo: parseLaudoContent(laudo.edited_content),
    imageBase64List,
    logoBase64,
    signatureFont: profile.signature_font,
    signatureImageBase64,
    crmvState: profile.crmv_state,
  };

  const buffer = await generatePdfBuffer(pdfData);

  // Cache the PDF in storage
  const storagePath = `${userId}/${id}/${filename}`;
  try {
    await admin.storage.from(PDF_BUCKET).upload(storagePath, Buffer.from(buffer), {
      contentType: "application/pdf",
      upsert: true,
    });
    await admin.from("laudos").update({ pdf_storage_path: storagePath }).eq("id", id).eq("user_id", userId);
  } catch (err) {
    console.error("Failed to cache PDF:", err);
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
