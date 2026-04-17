"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Laudo, LaudoImage, ParsedLaudo, sexLabel, SPECIES_OPTIONS, SEX_OPTIONS } from "@/shared";
import { parseLaudoContent } from "@/lib/parseLaudo";
import { getAuthHeaders } from "@/lib/supabase/client";
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

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
const textareaCls =
  "w-full border border-blue-200 rounded px-2 py-1 text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400";

export default function LaudoDetail({ laudo, images }: { laudo: Laudo; images: LaudoImage[] }) {
  const router = useRouter();
  const initialParsed = parseLaudoContent(laudo.edited_content);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editedParsed, setEditedParsed] = useState<ParsedLaudo>(initialParsed);
  const [fields, setFields] = useState({
    patientName: laudo.patient_name,
    species: laudo.species,
    breed: laudo.breed,
    age: laudo.age,
    sex: laudo.sex,
    neutered: laudo.neutered,
    ownerName: laudo.owner_name,
    clinicName: laudo.clinic_name,
    responsibleVet: laudo.responsible_vet,
    examDate: laudo.exam_date,
  });

  const examDate = new Date(fields.examDate + "T12:00:00").toLocaleDateString("pt-BR");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/laudos/${laudo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({
          generatedContent: editedParsed,
          patientFields: {
            patient_name: fields.patientName,
            species: fields.species,
            breed: fields.breed,
            age: fields.age,
            sex: fields.sex,
            neutered: fields.neutered,
            owner_name: fields.ownerName,
            clinic_name: fields.clinicName,
            responsible_vet: fields.responsibleVet,
            exam_date: fields.examDate,
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao salvar.");
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setEditedParsed(initialParsed);
    setFields({
      patientName: laudo.patient_name,
      species: laudo.species,
      breed: laudo.breed,
      age: laudo.age,
      sex: laudo.sex,
      neutered: laudo.neutered,
      ownerName: laudo.owner_name,
      clinicName: laudo.clinic_name,
      responsibleVet: laudo.responsible_vet,
      examDate: laudo.exam_date,
    });
    setIsEditing(false);
    setError("");
  }

  function updateSection(i: number, value: string) {
    const sections = [...editedParsed.sections];
    sections[i] = { ...sections[i], content: value };
    setEditedParsed({ ...editedParsed, sections });
  }

  function updateList(key: "impressao" | "recomendacoes" | "observacoes", i: number, value: string) {
    const list = [...(editedParsed[key] ?? [])];
    list[i] = value;
    setEditedParsed({ ...editedParsed, [key]: list });
  }

  function addToList(key: "impressao" | "recomendacoes" | "observacoes") {
    setEditedParsed({ ...editedParsed, [key]: [...(editedParsed[key] ?? []), ""] });
  }

  function removeFromList(key: "impressao" | "recomendacoes" | "observacoes", i: number) {
    const list = (editedParsed[key] ?? []).filter((_, idx) => idx !== i);
    setEditedParsed({ ...editedParsed, [key]: list.length ? list : undefined });
  }

  function EditableList({ listKey, title }: { listKey: "impressao" | "recomendacoes" | "observacoes"; title: string }) {
    const items = editedParsed[listKey] ?? [];
    return (
      <div>
        <h4 className="font-semibold text-gray-900 text-sm mb-2">{title}</h4>
        {items.map((line, i) => (
          <div key={i} className="mb-2 flex gap-1 items-start">
            <textarea
              value={line}
              onChange={(e) => updateList(listKey, i, e.target.value)}
              rows={2}
              className={`${textareaCls} flex-1`}
            />
            <button
              type="button"
              onClick={() => removeFromList(listKey, i)}
              className="text-red-400 hover:text-red-600 text-lg leading-none mt-1"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addToList(listKey)}
          className="text-xs text-blue-600 hover:text-blue-700 mt-1"
        >
          + Adicionar linha
        </button>
      </div>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-[fadeIn_0.3s_ease-out]">
        <div>
          <Link href="/dashboard" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← Voltar aos laudos
          </Link>
          <h1 className="text-xl font-bold text-gray-900 mt-2">{fields.patientName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              {SPECIALTY_LABELS[laudo.specialty]}
            </span>
            <span className="text-xs text-gray-400">{examDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {isEditing ? (
            <>
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          ) : (
            <>
              <DeleteLaudoButton laudoId={laudo.id} />
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-300"
              >
                Editar
              </button>
              <DownloadPDFButton laudoId={laudo.id} />
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 text-sm text-amber-700 animate-[fadeIn_0.2s_ease-out]">
          Modo de edição — as alterações ainda não foram salvas.
        </div>
      )}

      {/* Patient info */}
      {isEditing ? (
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
              <select
                value={fields.species}
                onChange={(e) => setFields({ ...fields, species: e.target.value })}
                className={inputCls}
              >
                {SPECIES_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
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
            <div>
              <label className="block text-xs text-gray-500 mb-1">Castrado(a)</label>
              <select
                value={fields.neutered ? "true" : "false"}
                onChange={(e) => setFields({ ...fields, neutered: e.target.value === "true" })}
                className={inputCls}
              >
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-[fadeIn_0.4s_ease-out]">
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 text-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Paciente</h3>
            <InfoItem label="Nome:" value={fields.patientName} />
            <InfoItem label="Espécie:" value={fields.species} />
            <InfoItem label="Raça:" value={fields.breed} />
            <InfoItem label="Idade:" value={fields.age} />
            <InfoItem label="Sexo:" value={sexLabel(fields.sex)} />
            <InfoItem label="Castrado(a):" value={fields.neutered ? "Sim" : "Não"} />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2 text-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Atendimento</h3>
            <InfoItem label="Responsável:" value={fields.ownerName} />
            <InfoItem label="Clínica:" value={fields.clinicName} />
            <InfoItem label="Médico:" value={fields.responsibleVet} />
            {examDate && <InfoItem label="Data do exame:" value={examDate} />}
          </div>
        </div>
      )}

      {/* Report content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-700 text-center uppercase tracking-wide">
            {SPECIALTY_LABELS[laudo.specialty]}
          </h2>
        </div>
        <div className="p-6">
          {isEditing ? (
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

              {(editedParsed.conclusion || editedParsed.impressao?.length) && (
                <div className="border-t border-gray-100 pt-4 mt-4">
                  <h3 className="font-bold text-gray-900 text-sm mb-3">CONCLUSÃO</h3>
                </div>
              )}

              {editedParsed.conclusion && !editedParsed.impressao?.length && (
                <textarea
                  value={editedParsed.conclusion}
                  onChange={(e) => setEditedParsed({ ...editedParsed, conclusion: e.target.value })}
                  rows={3}
                  className={textareaCls}
                />
              )}

              <EditableList listKey="impressao" title="IMPRESSÃO DIAGNÓSTICA:" />
              <EditableList listKey="recomendacoes" title="RECOMENDAÇÕES:" />
              <EditableList listKey="observacoes" title="OBS:" />
            </div>
          ) : (
            <LaudoContent parsedLaudo={editedParsed} />
          )}
        </div>
      </div>

      {/* Images */}
      <div className="animate-[fadeIn_0.6s_ease-out]">
        <ImageManager initialImages={images} laudoId={laudo.id} editable={isEditing} />
      </div>
    </main>
  );
}
