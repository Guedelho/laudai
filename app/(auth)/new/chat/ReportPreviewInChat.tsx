"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";
import { TABLES, REPORT_STATUSES, type ReportStatus } from "@/shared/constants";
import { type Report } from "@/shared/models";
import { createClient } from "@/lib/supabase/client";
import { useReportEditor } from "@/lib/hooks/use-report-editor";
import { useDirectory } from "@/lib/hooks/use-directory";
import { useOrgReportsChannel } from "@/lib/hooks/use-org-reports-channel";
import {
  ReportEditorPatientFields,
  ReportEditorContent,
  ReportEditorActions,
} from "@/app/(auth)/report/[id]/ReportEditor";
import { SPECIALTIES } from "@/lib/report/templates";
import { TypingDots } from "./ChatMessage";

export function ReportPreviewInChat({
  reportId,
  orgId,
  previewFiles,
}: {
  reportId: string;
  orgId: string;
  previewFiles: File[];
}) {
  const [phase, setPhase] = useState<"waiting" | "completed" | "failed" | "error">("waiting");
  const [report, setReport] = useState<Report | null>(null);

  async function fetchAndResolve() {
    const supabase = createClient();
    const { data, error } = await supabase.from(TABLES.reports).select("*").eq("id", reportId).single();
    if (error) {
      setPhase("error");
      return;
    }
    if (data.status === REPORT_STATUSES.completed && data.edited_content) {
      setReport(data as Report);
      setPhase("completed");
    } else if (data.status === REPORT_STATUSES.failed) {
      setPhase("failed");
    }
  }

  useOrgReportsChannel<{ id: string; status: ReportStatus }>(orgId, {
    onSubscribed: () => {
      fetchAndResolve().catch(() => setPhase("error"));
    },
    onEvent: (payload) => {
      if (payload.id !== reportId) return;
      if (payload.status === REPORT_STATUSES.completed) {
        fetchAndResolve().catch(() => setPhase("error"));
      } else if (payload.status === REPORT_STATUSES.failed) {
        setPhase("failed");
      }
    },
  });

  if (phase === "waiting") {
    return <TypingDots />;
  }

  if (phase === "failed" || phase === "error") {
    return (
      <div className="max-w-[85%] self-start rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900">
        {phase === "failed" ? "Falha ao gerar o laudo." : "Erro ao carregar o laudo."}{" "}
        <Link href={`/report/${reportId}`} className="underline hover:text-gray-700">
          Ver laudo →
        </Link>
      </div>
    );
  }

  if (!report) return null;

  return <ReportEditorInChat report={report} previewFiles={previewFiles} />;
}

function ReportEditorInChat({ report, previewFiles }: { report: Report; previewFiles: File[] }) {
  const editor = useReportEditor(report);
  const { pets, clients, breedSuggestions } = useDirectory();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fileUrls = useMemo(() => previewFiles.map((f) => URL.createObjectURL(f)), [previewFiles]);
  useEffect(() => () => fileUrls.forEach(URL.revokeObjectURL), [fileUrls]);

  return (
    <div className="self-start w-full space-y-3 rounded-2xl bg-gray-100 px-4 py-3">
      <p className="text-sm font-medium text-gray-900">Laudo pronto. Revise e edite antes de confirmar:</p>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
        Gerado por inteligência artificial. Revise todas as informações com atenção antes de confirmar.
      </div>

      {editor.error && <p className="text-sm text-red-600">{editor.error}</p>}

      <ReportEditorPatientFields
        fields={editor.fields}
        setFields={editor.setFields}
        pets={pets}
        clients={clients}
        breedSuggestions={breedSuggestions}
        selectedClientId={editor.selectedClientId}
        selectPet={editor.selectPet}
        selectClient={editor.selectClient}
        selectVet={editor.selectVet}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
            {SPECIALTIES[report.specialty].reportTitle}
          </h2>
        </div>
        <div className="p-4">
          <ReportEditorContent
            editedParsed={editor.editedParsed}
            setEditedParsed={editor.setEditedParsed}
            updateSection={editor.updateSection}
            removeSection={editor.removeSection}
            updateList={editor.updateList}
            addToList={editor.addToList}
            removeFromList={editor.removeFromList}
          />
        </div>
      </div>

      {fileUrls.length > 0 && (
        <div className="rounded-xl bg-white px-3 py-2.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Imagens do exame</p>
          <div className="grid grid-cols-3 gap-2">
            {fileUrls.map((url, i) => (
              <div key={url} className="cursor-pointer" onClick={() => setLightboxIndex(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={previewFiles[i]?.name ?? ""}
                  className="aspect-[4/3] w-full rounded-lg border border-gray-200 bg-black object-cover"
                />
              </div>
            ))}
          </div>
          {lightboxIndex !== null && (
            <ImageLightbox
              images={fileUrls.map((src) => ({ key: src, src }))}
              selectedIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <ReportEditorActions
          saving={editor.saving}
          printing={editor.printing}
          onSalvar={editor.handleSalvar}
          onImprimir={editor.handleImprimir}
        />
      </div>
    </div>
  );
}
