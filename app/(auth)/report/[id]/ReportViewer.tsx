"use client";

import { ParsedReport } from "@/shared/models";
import { sexLabel } from "@/lib/utils";
import { ReportFieldsState } from "@/lib/hooks/use-report-editor";
import DownloadPDFButton from "./DownloadPDFButton";
import DeleteReportButton from "./DeleteReportButton";
import ReportContent from "./ReportContent";

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1.5">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

interface ActionsProps {
  reportId: string;
  onEdit: () => void;
}

export function ReportViewerActions({ reportId, onEdit }: ActionsProps) {
  return (
    <>
      <DeleteReportButton reportId={reportId} />
      <button
        onClick={onEdit}
        className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
          />
        </svg>
        Editar
      </button>
      <DownloadPDFButton reportId={reportId} />
    </>
  );
}

export function ReportViewerInfo({ fields, displayDate }: { fields: ReportFieldsState; displayDate: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-[fadeIn_0.4s_ease-out]">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 text-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Paciente</h2>
        <InfoItem label="Nome:" value={fields.patientName} />
        <InfoItem label="Espécie:" value={fields.species} />
        <InfoItem label="Raça:" value={fields.breed} />
        <InfoItem label="Idade:" value={fields.age} />
        <InfoItem label="Sexo:" value={sexLabel(fields.sex)} />
        <InfoItem label="Castrado(a):" value={fields.neutered ? "Sim" : "Não"} />
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 text-sm">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Atendimento</h2>
        <InfoItem label="Responsável:" value={fields.ownerName} />
        <InfoItem label="Cliente:" value={fields.clientName} />
        <InfoItem label="Médico:" value={fields.responsibleVet} />
        {displayDate && <InfoItem label="Data do exame:" value={displayDate} />}
      </div>
    </div>
  );
}

export function ReportViewerContent({ parsedReport }: { parsedReport: ParsedReport }) {
  return <ReportContent parsedReport={parsedReport} />;
}
