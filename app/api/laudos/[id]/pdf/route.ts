import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { getUserId, getProfile } from "@/lib/gemini";
import { parseLaudoContent } from "@/lib/parseLaudo";
import { generatePdfBuffer, PdfData } from "@/lib/generatePdf";
import { Specialty } from "@/types";
import { REPORT_TITLES, SPECIALTY_ABBR } from "@/lib/templates";

const BUCKET = "laudo-images";

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);
}

async function fetchAsBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const arrayBuffer = await res.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  return `data:${contentType};base64,${base64}`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [profile, admin] = [
    await getProfile(userId),
    createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    ),
  ];

  const { data: laudo } = await admin
    .from("laudos")
    .select("*")
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

  // Fetch images as base64 for pdfmake
  const imageBase64List: string[] = [];
  let imageFailures = 0;
  for (const img of rawImages ?? []) {
    try {
      const { data } = await admin.storage.from(BUCKET).createSignedUrl(img.storage_path, 60);
      if (!data) { imageFailures++; continue; }
      const b64 = await fetchAsBase64(data.signedUrl);
      imageBase64List.push(b64);
    } catch (err) {
      console.error("Failed to load laudo image:", img.storage_path, err);
      imageFailures++;
    }
  }

  const specialty = laudo.specialty as Specialty;
  const createdAt = new Date(laudo.created_at);
  const date = createdAt.toLocaleDateString("pt-BR");
  const dateShort = [
    String(createdAt.getDate()).padStart(2, "0"),
    String(createdAt.getMonth() + 1).padStart(2, "0"),
    String(createdAt.getFullYear()).slice(2),
  ].join(".");

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
    "Content-Disposition": `attachment; filename="${filename}"`,
  };
  if (imageFailures > 0) responseHeaders["X-Image-Failures"] = String(imageFailures);

  return new NextResponse(new Uint8Array(buffer), { headers: responseHeaders });
}
