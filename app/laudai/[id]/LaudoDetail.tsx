import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Laudo, LaudoImage } from "@/types";
import { parseLaudoContent } from "@/lib/parseLaudo";
import DownloadPDFButton from "./DownloadPDFButton";
import DeleteLaudoButton from "./DeleteLaudoButton";
import ImageManager from "./ImageManager";
import LaudoContent from "./LaudoContent";

export default function LaudoDetail({ laudo, images }: { laudo: Laudo; images: LaudoImage[] }) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Laudos
          </Link>
          <h1 className="text-lg font-bold text-gray-900 mt-1">{laudo.patient_name}</h1>
          <p className="text-sm text-gray-500">{SPECIALTY_LABELS[laudo.specialty]}</p>
        </div>
        <div className="flex items-center gap-3">
          <DeleteLaudoButton laudoId={laudo.id} />
          <DownloadPDFButton laudoId={laudo.id} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="grid grid-cols-2 gap-x-8 text-sm mb-6 pb-4 border-b border-gray-200">
          <div className="space-y-1">
            <div><span className="font-bold">Paciente:</span> {laudo.patient_name}</div>
            <div><span className="font-bold">Espécie:</span> {laudo.species}</div>
            {laudo.breed && <div><span className="font-bold">Raça:</span> {laudo.breed}</div>}
            {laudo.age && <div><span className="font-bold">Idade:</span> {laudo.age}</div>}
            {laudo.sex && <div><span className="font-bold">Sexo:</span> {laudo.sex === "M" ? "Macho" : "Fêmea"}</div>}
            {laudo.neutered != null && <div><span className="font-bold">Castrado(a):</span> {laudo.neutered ? "Sim" : "Não"}</div>}
          </div>
          <div className="space-y-1">
            {laudo.clinic_name && <div><span className="font-bold">Clínica:</span> {laudo.clinic_name}</div>}
            {laudo.responsible_vet && <div><span className="font-bold">Médico Responsável:</span> {laudo.responsible_vet}</div>}
            <div><span className="font-bold">Responsável:</span> {laudo.owner_name}</div>
            <div><span className="font-bold">Data:</span> {new Date(laudo.created_at).toLocaleDateString("pt-BR")}</div>
          </div>
        </div>
        <div className="text-center font-bold underline text-sm mb-6">{SPECIALTY_LABELS[laudo.specialty].toUpperCase()}</div>
        <LaudoContent parsedLaudo={parseLaudoContent(laudo.generated_content)} />
        <ImageManager initialImages={images} />
      </div>
    </main>
  );
}
