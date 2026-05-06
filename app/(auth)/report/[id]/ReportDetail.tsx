"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SPECIALTIES } from "@/lib/report/templates";
import { Report, ReportImage, Pet, Clinic } from "@/shared/models";
import { listPets } from "@/lib/services/pets";
import { listClinics } from "@/lib/services/clinics";
import ImageManager from "./ImageManager";
import { useReportEditor } from "./useReportEditor";
import { ReportEditorActions, ReportEditorContent, ReportEditorPatientFields } from "./ReportEditor";
import { ReportViewerActions, ReportViewerContent, ReportViewerInfo } from "./ReportViewer";

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
  const [pets, setPets] = useState<Pet[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);

  useEffect(() => {
    Promise.all([listPets(), listClinics()])
      .then(([p, c]) => {
        setPets(p);
        setClinics(c);
      })
      .catch(() => {
        /* dropdowns just won't be offered */
      });
  }, []);

  const displayDate = new Date(editor.fields.examDate + "T12:00:00").toLocaleDateString("pt-BR");

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between mb-8 animate-[fadeIn_0.3s_ease-out]">
        <div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Voltar aos laudos
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">{editor.fields.patientName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {SPECIALTIES[report.specialty].label}
            </span>
            <span className="text-xs text-gray-400">{displayDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
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

      {editor.error && <p className="text-sm text-red-500 mb-4">{editor.error}</p>}

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
          clinics={clinics}
          selectedPetId={editor.selectedPetId}
          selectedClinicId={editor.selectedClinicId}
          selectedVetId={editor.selectedVetId}
          selectPet={editor.selectPet}
          selectClinic={editor.selectClinic}
          selectVet={editor.selectVet}
        />
      ) : (
        <ReportViewerInfo fields={editor.fields} displayDate={displayDate} />
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-700 text-center uppercase tracking-wide">
            {SPECIALTIES[report.specialty].label}
          </h2>
        </div>
        <div className="p-6">
          {editing ? (
            <ReportEditorContent
              editedParsed={editor.editedParsed}
              setEditedParsed={editor.setEditedParsed}
              updateSection={editor.updateSection}
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
  );
}
