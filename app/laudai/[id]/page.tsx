import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Laudo } from "@/types";
import { parseLaudoContent } from "@/lib/parseLaudo";
import DownloadPDFButton from "./DownloadPDFButton";
import ImageManager from "./ImageManager";
import LaudoContent from "./LaudoContent";

const BUCKET = "laudo-images";

function getLaudoData(id: string, userId: string) {
  return unstable_cache(
    async () => {
      const admin = createAdmin();
      const [{ data: laudo }, { data: rawImages }] = await Promise.all([
        admin.from("laudos").select("*").eq("id", id).eq("user_id", userId).single(),
        admin.from("laudo_images").select("*").eq("laudo_id", id).eq("user_id", userId).order("created_at", { ascending: true }),
      ]);

      const images = (
        await Promise.all(
          (rawImages ?? []).map(async (img) => {
            const { data } = await admin.storage.from(BUCKET).createSignedUrl(img.storage_path, 7200);
            if (!data) return null;
            return { id: img.id, file_name: img.file_name, url: data.signedUrl };
          })
        )
      ).filter(Boolean) as { id: string; file_name: string; url: string }[];

      return { laudo, images };
    },
    [`laudo-${id}-${userId}`],
    { tags: [`laudo-${id}`], revalidate: 7200 }
  )();
}

export default async function LaudoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { laudo, images } = await getLaudoData(id, user.id);

  if (!laudo) notFound();

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
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <div className="grid grid-cols-2 gap-x-8 text-sm mb-6 pb-4 border-b border-gray-200">
            <div className="space-y-1">
              <div><span className="font-bold">Paciente:</span> {l.patient_name}</div>
              <div><span className="font-bold">Espécie:</span> {l.species}</div>
              {l.breed && <div><span className="font-bold">Raça:</span> {l.breed}</div>}
              {l.age && <div><span className="font-bold">Idade:</span> {l.age}</div>}
              {l.sex && <div><span className="font-bold">Sexo:</span> {l.sex === "M" ? "Macho" : "Fêmea"}</div>}
              {l.neutered != null && <div><span className="font-bold">Castrado(a):</span> {l.neutered ? "Sim" : "Não"}</div>}
            </div>
            <div className="space-y-1">
              {l.clinic_name && <div><span className="font-bold">Clínica:</span> {l.clinic_name}</div>}
              {l.responsible_vet && <div><span className="font-bold">Médico Responsável:</span> {l.responsible_vet}</div>}
              <div><span className="font-bold">Responsável:</span> {l.owner_name}</div>
              <div><span className="font-bold">Data:</span> {new Date(l.created_at).toLocaleDateString("pt-BR")}</div>
            </div>
          </div>
          <div className="text-center font-bold underline text-sm mb-6">{SPECIALTY_LABELS[l.specialty].toUpperCase()}</div>
          <LaudoContent parsedLaudo={parseLaudoContent(l.generated_content)} />
          <ImageManager initialImages={images} />
        </div>
      </main>
    </div>
  );
}
