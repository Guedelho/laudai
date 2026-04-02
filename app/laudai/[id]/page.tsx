import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Laudo } from "@/types";
import { parseLaudoContent } from "@/lib/gemini";
import PrintButton from "./PrintButton";
import DownloadPDFButton from "./DownloadPDFButton";
import EditRawInput from "./EditRawInput";
import ImageManager from "./ImageManager";
import LaudoContent from "./LaudoContent";

const BUCKET = "laudo-images";

export default async function LaudoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: laudo } = await supabase
    .from("laudos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!laudo) notFound();

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: rawImages } = await admin
    .from("laudo_images")
    .select("*")
    .eq("laudo_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const images = (rawImages ?? []).map((img) => ({
    id: img.id,
    file_name: img.file_name,
    url: admin.storage.from(BUCKET).getPublicUrl(img.storage_path).data.publicUrl,
  }));

  const l = laudo as Laudo;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="print:hidden bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar
          </Link>
          <h1 className="text-lg font-bold text-gray-900 mt-1">{l.patient_name}</h1>
          <p className="text-sm text-gray-500">{SPECIALTY_LABELS[l.specialty]}</p>
        </div>
        <div className="flex gap-2">
          <DownloadPDFButton laudoId={l.id} />
          <PrintButton laudoId={l.id} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          {/* Patient header */}
          <div className="grid grid-cols-2 gap-x-6 text-sm mb-6 pb-4 border-b border-gray-200">
            <div className="space-y-1">
              {l.clinic_name && <div><span className="font-bold">Clínica:</span> {l.clinic_name}</div>}
              {l.responsible_vet && <div><span className="font-bold">Médico Vet.:</span> {l.responsible_vet}</div>}
              <div><span className="font-bold">Animal:</span> {l.patient_name}</div>
              <div><span className="font-bold">Espécie:</span> {l.species}</div>
              {l.breed && <div><span className="font-bold">Raça:</span> {l.breed}</div>}
              {l.age && <div><span className="font-bold">Idade:</span> {l.age}</div>}
            </div>
            <div className="space-y-1">
              <div><span className="font-bold">Tutor:</span> {l.owner_name}</div>
              <div><span className="font-bold">Data:</span> {new Date(l.created_at).toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
          <div className="text-center font-bold underline text-sm mb-6">{SPECIALTY_LABELS[l.specialty].toUpperCase()}</div>
          <LaudoContent parsedLaudo={parseLaudoContent(l.generated_content)} />
          <ImageManager laudoId={l.id} initialImages={images} />
        </div>
        <div className="print:hidden">
          <EditRawInput laudoId={l.id} initialRawInput={l.raw_input} />
        </div>
      </main>
    </div>
  );
}
