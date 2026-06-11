"use client";

import { useState } from "react";
import Link from "next/link";
import { SPECIALTIES } from "@/lib/report/templates";
import { Report, ReportImage } from "@/shared/models";
import { formatExamDate } from "@/lib/utils";
import { useDirectory } from "@/lib/hooks/use-directory";
import { btnSecondary } from "@/lib/ui";
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
              className={btnSecondary}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
                />
              </svg>
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
