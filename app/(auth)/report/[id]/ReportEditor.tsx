"use client";

import { ParsedReport } from "@/shared/models";
import { SEX_OPTIONS } from "@/shared/constants";
import { ReportFieldsState } from "./useReportEditor";

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
const textareaCls =
  "w-full border border-blue-200 rounded px-2 py-1 text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400";

type ListKey = "impression" | "recommendations" | "observations";

function EditableList({
  title,
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  title: string;
  items: string[];
  onUpdate: (i: number, value: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) {
  return (
    <div>
      <h4 className="font-semibold text-gray-900 text-sm mb-2">{title}</h4>
      {items.map((line, i) => (
        <div key={i} className="mb-2 flex gap-1 items-start">
          <textarea
            value={line}
            onChange={(e) => onUpdate(i, e.target.value)}
            rows={2}
            className="w-full border border-blue-200 rounded px-2 py-1 text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400 flex-1"
          />
          <button
            type="button"
            onClick={() => onRemove(i)}
            className="text-red-400 hover:text-red-600 text-lg leading-none mt-1"
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={onAdd} className="text-xs text-blue-600 hover:text-blue-700 mt-1">
        + Adicionar linha
      </button>
    </div>
  );
}

interface ActionsProps {
  saving: boolean;
  printing: boolean;
  onSalvar: () => void;
  onImprimir: () => void;
}

export function ReportEditorActions({ saving, printing, onSalvar, onImprimir }: ActionsProps) {
  return (
    <>
      <button
        onClick={onSalvar}
        disabled={saving || printing}
        className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
          />
        </svg>
        {saving ? "Salvando..." : "Salvar"}
      </button>
      <button
        onClick={onImprimir}
        disabled={printing || saving}
        className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18.75 7.131s0 0 0 0"
          />
        </svg>
        {printing ? "Imprimindo..." : "Imprimir"}
      </button>
    </>
  );
}

interface EditorProps {
  fields: ReportFieldsState;
  setFields: (f: ReportFieldsState) => void;
  editedParsed: ParsedReport;
  setEditedParsed: (p: ParsedReport) => void;
  updateSection: (i: number, value: string) => void;
  updateList: (key: ListKey, i: number, value: string) => void;
  addToList: (key: ListKey) => void;
  removeFromList: (key: ListKey, i: number) => void;
}

export function ReportEditorPatientFields({ fields, setFields }: Pick<EditorProps, "fields" | "setFields">) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paciente</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Nome</label>
          <input
            value={fields.patientName}
            onChange={(e) => setFields({ ...fields, patientName: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Espécie</label>
          <input
            value={fields.species}
            onChange={(e) => setFields({ ...fields, species: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Raça</label>
          <input
            value={fields.breed}
            onChange={(e) => setFields({ ...fields, breed: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Idade</label>
          <input
            value={fields.age}
            onChange={(e) => setFields({ ...fields, age: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sexo</label>
          <select
            value={fields.sex}
            onChange={(e) => setFields({ ...fields, sex: e.target.value })}
            className={inputCls}
          >
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="neutered"
            type="checkbox"
            checked={fields.neutered}
            onChange={(e) => setFields({ ...fields, neutered: e.target.checked })}
            className="rounded border-gray-300"
          />
          <label htmlFor="neutered" className="text-sm text-gray-700">
            Castrado(a)
          </label>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Atendimento</h3>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Responsável</label>
          <input
            value={fields.ownerName}
            onChange={(e) => setFields({ ...fields, ownerName: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Clínica</label>
          <input
            value={fields.clinicName}
            onChange={(e) => setFields({ ...fields, clinicName: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Médico Responsável</label>
          <input
            value={fields.responsibleVet}
            onChange={(e) => setFields({ ...fields, responsibleVet: e.target.value })}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Data do exame</label>
          <input
            type="date"
            value={fields.examDate}
            onChange={(e) => setFields({ ...fields, examDate: e.target.value })}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}

export function ReportEditorContent({
  editedParsed,
  setEditedParsed,
  updateSection,
  updateList,
  addToList,
  removeFromList,
}: Pick<
  EditorProps,
  "editedParsed" | "setEditedParsed" | "updateSection" | "updateList" | "addToList" | "removeFromList"
>) {
  return (
    <div className="text-sm text-gray-800 leading-relaxed space-y-3">
      {editedParsed.sections.map((section, i) => (
        <div key={i}>
          <span className="font-semibold text-gray-900">{section.label}:</span>
          <textarea
            value={section.content}
            onChange={(e) => updateSection(i, e.target.value)}
            rows={3}
            className={`${textareaCls} mt-1 block`}
          />
        </div>
      ))}

      {(editedParsed.conclusion || editedParsed.impression?.length) && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">CONCLUSÃO</h3>
        </div>
      )}

      {editedParsed.conclusion && !editedParsed.impression?.length && (
        <textarea
          value={editedParsed.conclusion}
          onChange={(e) => setEditedParsed({ ...editedParsed, conclusion: e.target.value })}
          rows={3}
          className={textareaCls}
        />
      )}

      <EditableList
        title="IMPRESSÃO DIAGNÓSTICA:"
        items={editedParsed.impression ?? []}
        onUpdate={(i, v) => updateList("impression", i, v)}
        onAdd={() => addToList("impression")}
        onRemove={(i) => removeFromList("impression", i)}
      />
      <EditableList
        title="RECOMENDAÇÕES:"
        items={editedParsed.recommendations ?? []}
        onUpdate={(i, v) => updateList("recommendations", i, v)}
        onAdd={() => addToList("recommendations")}
        onRemove={(i) => removeFromList("recommendations", i)}
      />
      <EditableList
        title="OBS:"
        items={editedParsed.observations ?? []}
        onUpdate={(i, v) => updateList("observations", i, v)}
        onAdd={() => addToList("observations")}
        onRemove={(i) => removeFromList("observations", i)}
      />
    </div>
  );
}
