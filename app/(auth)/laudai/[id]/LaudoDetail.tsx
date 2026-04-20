"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { SPECIALTIES } from "@/lib/laudo/templates";
import { Laudo, LaudoImage, ParsedLaudo } from "@/shared/models";
import { SEX_OPTIONS } from "@/shared/constants";
import { sexLabel, parseLaudoContent } from "@/lib/utils";
import { UpdateLaudoRequest } from "@/shared/interfaces";
import { updateLaudo, lockLaudo, uploadImages } from "@/lib/api/laudos";
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

function EditableList({
  listKey,
  title,
  items,
  onUpdate,
  onAdd,
  onRemove,
}: {
  listKey: string;
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

const inputCls =
  "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
const textareaCls =
  "w-full border border-blue-200 rounded px-2 py-1 text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400";

export default function LaudoDetail({
  laudo,
  images,
  isEditing,
}: {
  laudo: Laudo;
  images: LaudoImage[];
  isEditing: boolean;
}) {
  const initialParsed = parseLaudoContent(laudo.edited_content);

  const [printing, setPrinting] = useState(false);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const editing = isEditing && !locked;
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

  useEffect(() => {
    if (!isEditing && !laudo.locked_at) {
      lockLaudo(laudo.id);
    }
  }, [isEditing, laudo.id, laudo.locked_at]);

  async function handleImprimir() {
    setPrinting(true);
    setError("");
    try {
      await updateLaudo(laudo.id, {
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
        petId: laudo.pet_id ?? undefined,
        clinicId: laudo.clinic_id ?? undefined,
        vetId: laudo.vet_id ?? undefined,
      });

      await lockLaudo(laudo.id);

      const tab = window.open("", "_blank");
      if (tab) {
        tab.document.write(
          [
            "<!DOCTYPE html><html><head><title>Laudai</title><style>",
            "*{margin:0;padding:0;box-sizing:border-box}",
            "body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;font-family:system-ui,-apple-system,sans-serif}",
            ".c{text-align:center;animation:fadeIn .4s ease-out}",
            ".s{width:40px;height:40px;border:3px solid #e5e7eb;border-top-color:#2563eb;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 16px}",
            "h1{font-size:18px;font-weight:600;color:#111827;margin-bottom:6px}",
            "p{font-size:14px;color:#6b7280;animation:pulse 2s ease-in-out infinite}",
            "@keyframes spin{to{transform:rotate(360deg)}}",
            "@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}",
            "@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}",
            '</style></head><body><div class="c"><div class="s"></div><h1>Laudai</h1><p>Preparando PDF...</p></div></body></html>',
          ].join(""),
        );
        tab.location.href = `/api/laudos/${laudo.id}/pdf`;
      }

      setLocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao imprimir.");
    } finally {
      setPrinting(false);
    }
  }

  function updateSection(i: number, value: string) {
    const sections = [...editedParsed.sections];
    sections[i] = { ...sections[i], content: value };
    setEditedParsed({ ...editedParsed, sections });
  }

  function updateList(key: "impression" | "recommendations" | "observations", i: number, value: string) {
    const list = [...(editedParsed[key] ?? [])];
    list[i] = value;
    setEditedParsed({ ...editedParsed, [key]: list });
  }

  function addToList(key: "impression" | "recommendations" | "observations") {
    setEditedParsed({ ...editedParsed, [key]: [...(editedParsed[key] ?? []), ""] });
  }

  function removeFromList(key: "impression" | "recommendations" | "observations", i: number) {
    const list = (editedParsed[key] ?? []).filter((_, idx) => idx !== i);
    setEditedParsed({ ...editedParsed, [key]: list.length ? list : undefined });
  }

  const displayDate = new Date(fields.examDate + "T12:00:00").toLocaleDateString("pt-BR");

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
              {SPECIALTIES[laudo.specialty].label}
            </span>
            <span className="text-xs text-gray-400">{displayDate}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {editing ? (
            <button
              onClick={handleImprimir}
              disabled={printing}
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
          ) : (
            <>
              <DeleteLaudoButton laudoId={laudo.id} />
              <DownloadPDFButton laudoId={laudo.id} />
            </>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {editing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 mb-4 text-sm text-yellow-700 animate-[fadeIn_0.2s_ease-out]">
          Este laudo foi gerado por inteligência artificial e pode conter imprecisões. Revise todas as informações com
          atenção antes de salvar.
        </div>
      )}

      {/* Patient info */}
      {editing ? (
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
            {displayDate && <InfoItem label="Data do exame:" value={displayDate} />}
          </div>
        </div>
      )}

      {/* Report content */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden animate-[fadeIn_0.5s_ease-out]">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
          <h2 className="text-sm font-semibold text-gray-700 text-center uppercase tracking-wide">
            {SPECIALTIES[laudo.specialty].label}
          </h2>
        </div>
        <div className="p-6">
          {editing ? (
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
                listKey="impression"
                title="IMPRESSÃO DIAGNÓSTICA:"
                items={editedParsed.impression ?? []}
                onUpdate={(i, v) => updateList("impression", i, v)}
                onAdd={() => addToList("impression")}
                onRemove={(i) => removeFromList("impression", i)}
              />
              <EditableList
                listKey="recommendations"
                title="RECOMENDAÇÕES:"
                items={editedParsed.recommendations ?? []}
                onUpdate={(i, v) => updateList("recommendations", i, v)}
                onAdd={() => addToList("recommendations")}
                onRemove={(i) => removeFromList("recommendations", i)}
              />
              <EditableList
                listKey="observations"
                title="OBS:"
                items={editedParsed.observations ?? []}
                onUpdate={(i, v) => updateList("observations", i, v)}
                onAdd={() => addToList("observations")}
                onRemove={(i) => removeFromList("observations", i)}
              />
            </div>
          ) : (
            <LaudoContent parsedLaudo={editedParsed} />
          )}
        </div>
      </div>

      {/* Images */}
      <div className="animate-[fadeIn_0.6s_ease-out]">
        <ImageManager initialImages={images} laudoId={laudo.id} editable={editing} />
      </div>
    </main>
  );
}
