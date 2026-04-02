import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createElement } from "react";
import { getUserId, getProfile } from "@/lib/gemini";
import { LaudoPDF, LaudoPDFData } from "@/lib/laudoPdf";
import { renderToBuffer } from "@react-pdf/renderer";
import { Specialty } from "@/types";

const BUCKET = "laudo-images";

const REPORT_TITLES: Record<Specialty, string> = {
  ultrasound_abdominal: "RELATÓRIO ULTRASSONOGRÁFICO",
  ultrasound_thoracic: "RELATÓRIO ULTRASSONOGRÁFICO - TÓRAX",
  dental: "RELATÓRIO ODONTOLÓGICO",
  xray: "RELATÓRIO RADIOGRÁFICO",
};

const SPECIALTY_ABBR: Record<Specialty, string> = {
  ultrasound_abdominal: "us",
  ultrasound_thoracic: "us",
  dental: "dental",
  xray: "rx",
};

function slugify(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 20);
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

  const images = (rawImages ?? []).map((img) => ({
    url: admin.storage.from(BUCKET).getPublicUrl(img.storage_path).data.publicUrl,
  }));

  const specialty = laudo.specialty as Specialty;
  const createdAt = new Date(laudo.created_at);
  const date = createdAt.toLocaleDateString("pt-BR");
  const dateShort = [
    String(createdAt.getDate()).padStart(2, "0"),
    String(createdAt.getMonth() + 1).padStart(2, "0"),
    String(createdAt.getFullYear()).slice(2),
  ].join(".");

  const pdfData: LaudoPDFData = {
    patientName: laudo.patient_name,
    species: laudo.species,
    breed: laudo.breed,
    age: laudo.age,
    ownerName: laudo.owner_name,
    date,
    reportTitle: REPORT_TITLES[specialty],
    vetName: profile?.full_name ?? "",
    crmv: profile?.crmv ?? "",
    generatedContent: laudo.generated_content,
    images,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(createElement(LaudoPDF, { data: pdfData }) as any) as Buffer;

  // Filename: Laudo.us.Chico.Juliana.09.03.26.pdf
  const filename = [
    "Laudo",
    SPECIALTY_ABBR[specialty],
    slugify(laudo.patient_name),
    slugify(laudo.owner_name),
    dateShort,
  ].join(".") + ".pdf";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
