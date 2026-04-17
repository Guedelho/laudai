import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Laudo, LaudoImage, sexLabel } from "@/types";
import { parseLaudoContent } from "@/lib/parseLaudo";
import DownloadPDFButton from "./DownloadPDFButton";
import DeleteLaudoButton from "./DeleteLaudoButton";
import ImageManager from "./ImageManager";
import LaudoContent from "./LaudoContent";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-gray-400 shrink-0">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

export default function LaudoDetail({ laudo, images }: { laudo: Laudo; images: LaudoImage[] }) {
  const displayDate = laudo.exam_date
    ? new Date(laudo.exam_date + "T12:00:00").toLocaleDateString("pt-BR")
    : new Date(laudo.created_at).toLocaleDateString("pt-BR");

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-[fadeIn_0.3s_ease-out]">
        <div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Voltar aos laudos
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">{laudo.patient_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {SPECIALTY_LABELS[laudo.specialty]}
            </span>
            <span className="text-xs text-gray-400">{displayDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <DeleteLaudoButton laudoId={laudo.id} />
          <DownloadPDFButton laudoId={laudo.id} />
        </div>
      </div>

      {/* Patient info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-[fadeIn_0.4s_ease-out]">
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 text-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Paciente</h3>
          <InfoItem label="Nome:" value={laudo.patient_name} />
          <InfoItem label="Espécie:" value={laudo.species} />
          {laudo.breed && <InfoItem label="Raça:" value={laudo.breed} />}
          {laudo.age && <InfoItem label="Idade:" value={laudo.age} />}
          <InfoItem label="Sexo:" value={sexLabel(laudo.sex)} />
          <InfoItem label="Castrado(a):" value={laudo.neutered ? "Sim" : "Não"} />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 text-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Atendimento</h3>
          <InfoItem label="Responsável:" value={laudo.owner_name} />
          {laudo.clinic_name && <InfoItem label="Clínica:" value={laudo.clinic_name} />}
          {laudo.responsible_vet && <InfoItem label="Médico:" value={laudo.responsible_vet} />}
          <InfoItem label="Data:" value={displayDate} />
        </div>
      </div>

      {/* Report content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-700 text-center uppercase tracking-wide">
            {SPECIALTY_LABELS[laudo.specialty]}
          </h2>
        </div>
        <div className="p-6">
          <LaudoContent parsedLaudo={parseLaudoContent(laudo.generated_content)} />
        </div>
      </div>

      {/* Images */}
      <div className="animate-[fadeIn_0.6s_ease-out]">
        <ImageManager initialImages={images} laudoId={laudo.id} />
      </div>
    </main>
  );
}
