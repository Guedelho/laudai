"use client";

import { useState } from "react";
import Link from "next/link";
import { SPECIALTIES } from "@/lib/report/templates";
import { Report, ReportImage } from "@/shared/models";
import { formatExamDate } from "@/lib/utils";
import { useDirectory } from "@/lib/hooks/use-directory";
import { btnAssistant } from "@/lib/ui";
import { SparkleIcon } from "@/components/icons";
import ImageManager from "./ImageManager";
import { useReportEditor } from "@/lib/hooks/use-report-editor";
import { ReportEditorActions, ReportEditorContent, ReportEditorPatientFields } from "./ReportEditor";
import { ReportViewerActions, ReportViewerContent, ReportViewerInfo } from "./ReportViewer";
import DeleteReportButton from "./DeleteReportButton";

export default function ReportDetail({
  report,
  images,
  isEditing,
}: {
  report: Report;
  images: ReportImage[];
  isEditing: boolean;
}) {
  const [editing, setEditing] = useState(isEditing);
  const editor = useReportEditor(report, () => setEditing(false));
  const { pets, clients, breedSuggestions } = useDirectory();

  const displayDate = formatExamDate(editor.fields.examDate);

  return (
    <>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="mb-4 animate-[fadeIn_0.3s_ease-out]">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← Voltar aos laudos
          </Link>
          <h1 className="text-xl font-semibold text-gray-900 mt-2">{editor.fields.patientName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {SPECIALTIES[report.specialty].label}
            </span>
            <span className="text-xs text-gray-500">{displayDate}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-8 animate-[fadeIn_0.4s_ease-out]">
          <div>{!editing && <DeleteReportButton reportId={report.id} />}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/new/chat?report=${report.id}`}
              aria-label="Discutir laudo com assistente"
              title="Discutir laudo com assistente"
              className={btnAssistant}
            >
              <SparkleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Discutir</span>
            </Link>
            {editing ? (
              <ReportEditorActions
                saving={editor.saving}
                printing={editor.printing}
                onSalvar={editor.handleSalvar}
                onImprimir={editor.handleImprimir}
              />
            ) : (
              <ReportViewerActions reportId={report.id} onEdit={() => setEditing(true)} />
            )}
          </div>
        </div>

        {editor.error && <p className="text-sm text-red-600 mb-4">{editor.error}</p>}

        {editing && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-4 text-sm text-yellow-700 animate-[fadeIn_0.2s_ease-out]">
            Este laudo foi gerado por inteligência artificial e pode conter imprecisões. Revise todas as informações com
            atenção antes de salvar.
          </div>
        )}

        {editing ? (
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
        ) : (
          <ReportViewerInfo fields={editor.fields} displayDate={displayDate} />
        )}

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-[fadeIn_0.5s_ease-out]">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
            <h2 className="text-sm font-semibold text-gray-700 text-center uppercase tracking-wide">
              {SPECIALTIES[report.specialty].reportTitle}
            </h2>
          </div>
          <div className="p-6">
            {editing ? (
              <ReportEditorContent
                editedParsed={editor.editedParsed}
                setEditedParsed={editor.setEditedParsed}
                updateSection={editor.updateSection}
                removeSection={editor.removeSection}
                updateList={editor.updateList}
                addToList={editor.addToList}
                removeFromList={editor.removeFromList}
              />
            ) : (
              <ReportViewerContent parsedReport={editor.editedParsed} />
            )}
          </div>
        </div>

        <div className="animate-[fadeIn_0.6s_ease-out]">
          <ImageManager initialImages={images} reportId={report.id} editable={editing} />
        </div>
      </main>
    </>
  );
}
