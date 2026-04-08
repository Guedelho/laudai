"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ParsedLaudo } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { SPECIALTY_LABELS } from "@/lib/templates";

interface ReviewFields {
  patientName: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean | null;
  ownerName: string;
  clinicName: string;
  responsibleVet: string;
  createdAt: string;
}

interface LaudoImage {
  id: string;
  file_name: string;
  url: string;
}

interface Props {
  laudoId: string;
  initialParsed: ParsedLaudo;
  initialFields: ReviewFields;
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";
const textareaCls = "w-full border border-blue-200 rounded px-2 py-1 font-mono text-sm text-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400";

export default function LaudoReviewPanel({ laudoId, initialParsed, initialFields }: Props) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editedParsed, setEditedParsed] = useState<ParsedLaudo>(initialParsed);
  const [editedFields, setEditedFields] = useState<ReviewFields>(initialFields);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<LaudoImage[]>([]);

  useEffect(() => {
    async function fetchImages() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
      const res = await fetch(`/api/laudos/${laudoId}/images`, { headers });
      if (res.ok) {
        const data = await res.json();
        setImages(data.images ?? []);
      }
    }
    fetchImages();
  }, [laudoId]);

  async function getAuthHeader(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) return { Authorization: `Bearer ${session.access_token}` };
    return {};
  }

  async function saveToDb(parsed: ParsedLaudo, fields: ReviewFields) {
    const authHeader = await getAuthHeader();
    const res = await fetch(`/api/laudos/${laudoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify({
        generatedContent: parsed,
        patientFields: {
          patient_name: fields.patientName,
          species: fields.species,
          breed: fields.breed || null,
          age: fields.age || null,
          sex: fields.sex || null,
          neutered: fields.neutered,
          owner_name: fields.ownerName,
          clinic_name: fields.clinicName || null,
          responsible_vet: fields.responsibleVet || null,
        },
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao salvar.");
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await saveToDb(editedParsed, editedFields);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndClose() {
    setSaving(true);
    setError("");
    try {
      await saveToDb(editedParsed, editedFields);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
      setSaving(false);
    }
  }

  async function handlePdf(download: boolean) {
    setPdfLoading(true);
    setError("");
    try {
      await saveToDb(editedParsed, editedFields);
      const authHeader = await getAuthHeader();
      const res = await fetch(`/api/laudos/${laudoId}/pdf`, { headers: authHeader });
      if (!res.ok) throw new Error("Erro ao gerar PDF.");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (download) {
        const disposition = res.headers.get("Content-Disposition") ?? "";
        const filename = disposition.match(/filename="(.+)"/)?.[1] ?? "laudo.pdf";
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const w = window.open(url);
        if (w) w.addEventListener("load", () => { w.print(); URL.revokeObjectURL(url); });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  function updateSection(i: number, content: string) {
    const sections = [...editedParsed.sections];
    sections[i] = { ...sections[i], content };
    setEditedParsed({ ...editedParsed, sections });
  }

  function updateImpressao(i: number, value: string) {
    const impressao = [...(editedParsed.impressao ?? [])];
    impressao[i] = value;
    setEditedParsed({ ...editedParsed, impressao });
  }

  function addImpressao() {
    setEditedParsed({ ...editedParsed, impressao: [...(editedParsed.impressao ?? []), ""] });
  }

  function removeImpressao(i: number) {
    const impressao = (editedParsed.impressao ?? []).filter((_, idx) => idx !== i);
    setEditedParsed({ ...editedParsed, impressao: impressao.length ? impressao : undefined });
  }

  function updateRecomendacao(i: number, value: string) {
    const recomendacoes = [...(editedParsed.recomendacoes ?? [])];
    recomendacoes[i] = value;
    setEditedParsed({ ...editedParsed, recomendacoes });
  }

  function addRecomendacao() {
    setEditedParsed({ ...editedParsed, recomendacoes: [...(editedParsed.recomendacoes ?? []), ""] });
  }

  function removeRecomendacao(i: number) {
    const recomendacoes = (editedParsed.recomendacoes ?? []).filter((_, idx) => idx !== i);
    setEditedParsed({ ...editedParsed, recomendacoes: recomendacoes.length ? recomendacoes : undefined });
  }

  const date = new Date(editedFields.createdAt).toLocaleDateString("pt-BR");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{editedFields.patientName || "Laudo"}</h1>
          <p className="text-sm text-gray-500">{SPECIALTY_LABELS["ultrasound_abdominal"]}</p>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => { setEditedParsed(initialParsed); setEditedFields(initialFields); setIsEditing(false); setError(""); }}
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
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-300"
              >
                Editar laudo
              </button>
              <button
                onClick={() => handlePdf(false)}
                disabled={pdfLoading}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
              >
                {pdfLoading ? "Aguarde..." : "Imprimir"}
              </button>
              <button
                onClick={() => handlePdf(true)}
                disabled={pdfLoading}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50"
              >
                {pdfLoading ? "Aguarde..." : "Download PDF"}
              </button>
              <button
                onClick={handleSaveAndClose}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar e fechar"}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        {isEditing && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 text-sm text-amber-700">
            Modo de edição — as alterações ainda não foram salvas.
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-xl p-8">
          {/* Patient / clinic header */}
          <div className="grid grid-cols-2 gap-x-8 text-sm mb-6 pb-4 border-b border-gray-200">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Paciente</label>
                    <input value={editedFields.patientName} onChange={(e) => setEditedFields({ ...editedFields, patientName: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Espécie</label>
                    <select value={editedFields.species} onChange={(e) => setEditedFields({ ...editedFields, species: e.target.value })} className={inputCls}>
                      <option value="Canino">Canino</option>
                      <option value="Felino">Felino</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Raça</label>
                    <input value={editedFields.breed} onChange={(e) => setEditedFields({ ...editedFields, breed: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Idade</label>
                    <input value={editedFields.age} onChange={(e) => setEditedFields({ ...editedFields, age: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sexo</label>
                    <select value={editedFields.sex} onChange={(e) => setEditedFields({ ...editedFields, sex: e.target.value })} className={inputCls}>
                      <option value="">Não informado</option>
                      <option value="M">Macho</option>
                      <option value="F">Fêmea</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Castrado(a)</label>
                    <select value={editedFields.neutered === null ? "" : editedFields.neutered ? "true" : "false"} onChange={(e) => setEditedFields({ ...editedFields, neutered: e.target.value === "" ? null : e.target.value === "true" })} className={inputCls}>
                      <option value="">Não informado</option>
                      <option value="false">Não</option>
                      <option value="true">Sim</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Clínica</label>
                    <input value={editedFields.clinicName} onChange={(e) => setEditedFields({ ...editedFields, clinicName: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Médico Responsável</label>
                    <input value={editedFields.responsibleVet} onChange={(e) => setEditedFields({ ...editedFields, responsibleVet: e.target.value })} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Responsável</label>
                    <input value={editedFields.ownerName} onChange={(e) => setEditedFields({ ...editedFields, ownerName: e.target.value })} className={inputCls} />
                  </div>
                  <div className="text-sm text-gray-500 pt-1">Data: {date}</div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <div><span className="font-bold">Paciente:</span> {editedFields.patientName}</div>
                  <div><span className="font-bold">Espécie:</span> {editedFields.species}</div>
                  {editedFields.breed && <div><span className="font-bold">Raça:</span> {editedFields.breed}</div>}
                  {editedFields.age && <div><span className="font-bold">Idade:</span> {editedFields.age}</div>}
                  {editedFields.sex && <div><span className="font-bold">Sexo:</span> {editedFields.sex === "M" ? "Macho" : "Fêmea"}</div>}
                  {editedFields.neutered != null && <div><span className="font-bold">Castrado(a):</span> {editedFields.neutered ? "Sim" : "Não"}</div>}
                </div>
                <div className="space-y-1">
                  {editedFields.clinicName && <div><span className="font-bold">Clínica:</span> {editedFields.clinicName}</div>}
                  {editedFields.responsibleVet && <div><span className="font-bold">Médico Responsável:</span> {editedFields.responsibleVet}</div>}
                  <div><span className="font-bold">Responsável:</span> {editedFields.ownerName}</div>
                  <div><span className="font-bold">Data:</span> {date}</div>
                </div>
              </>
            )}
          </div>

          {/* Specialty title */}
          <div className="text-center font-bold underline text-sm mb-6">
            {SPECIALTY_LABELS["ultrasound_abdominal"].toUpperCase()}
          </div>

          {/* Generated content */}
          <div className="font-mono text-sm text-gray-800 leading-relaxed">
            {editedParsed.sections.map((section, i) => (
              <div key={i} className="mb-3">
                <span className="font-bold">{section.label}:</span>
                {isEditing ? (
                  <textarea
                    value={section.content}
                    onChange={(e) => updateSection(i, e.target.value)}
                    rows={3}
                    className={`${textareaCls} mt-1 block`}
                  />
                ) : (
                  <span className="text-justify"> {section.content}</span>
                )}
              </div>
            ))}

            {(editedParsed.conclusion || editedParsed.impressao?.length) && (
              <div className="mt-4 mb-2 font-bold underline text-sm">CONCLUSÃO</div>
            )}

            {editedParsed.conclusion && !editedParsed.impressao?.length && (
              <div className="mb-2 text-justify">
                {isEditing ? (
                  <textarea
                    value={editedParsed.conclusion}
                    onChange={(e) => setEditedParsed({ ...editedParsed, conclusion: e.target.value })}
                    rows={3}
                    className={textareaCls}
                  />
                ) : editedParsed.conclusion}
              </div>
            )}

            {(editedParsed.impressao?.length || isEditing) && (
              <>
                <div className="font-bold text-sm mt-2 mb-1">IMPRESSÃO DIAGNÓSTICA:</div>
                {(editedParsed.impressao ?? []).map((line, i) => (
                  <div key={i} className="mb-1 flex gap-1 items-start">
                    {isEditing ? (
                      <>
                        <textarea
                          value={line}
                          onChange={(e) => updateImpressao(i, e.target.value)}
                          rows={2}
                          className={`${textareaCls} flex-1`}
                        />
                        <button type="button" onClick={() => removeImpressao(i)} className="text-red-400 hover:text-red-600 text-lg leading-none mt-1">×</button>
                      </>
                    ) : (
                      <span className="text-justify">{line}</span>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button type="button" onClick={addImpressao} className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                    + Adicionar linha
                  </button>
                )}
              </>
            )}

            {(editedParsed.recomendacoes?.length || isEditing) && (
              <>
                <div className="font-bold text-sm mt-3 mb-1">RECOMENDAÇÕES:</div>
                {(editedParsed.recomendacoes ?? []).map((line, i) => (
                  <div key={i} className="mb-1 flex gap-1 items-start">
                    {isEditing ? (
                      <>
                        <textarea
                          value={line}
                          onChange={(e) => updateRecomendacao(i, e.target.value)}
                          rows={2}
                          className={`${textareaCls} flex-1`}
                        />
                        <button type="button" onClick={() => removeRecomendacao(i)} className="text-red-400 hover:text-red-600 text-lg leading-none mt-1">×</button>
                      </>
                    ) : (
                      <span className="text-justify">• {line}</span>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button type="button" onClick={addRecomendacao} className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                    + Adicionar linha
                  </button>
                )}
              </>
            )}

            {(editedParsed.observacoes?.length || isEditing) && (
              <>
                <div className="font-bold text-sm mt-3 mb-1">OBS:</div>
                {(editedParsed.observacoes ?? []).map((line, i) => (
                  <div key={i} className="mb-1 flex gap-1 items-start">
                    {isEditing ? (
                      <>
                        <textarea
                          value={line}
                          onChange={(e) => {
                            const obs = [...(editedParsed.observacoes ?? [])];
                            obs[i] = e.target.value;
                            setEditedParsed({ ...editedParsed, observacoes: obs });
                          }}
                          rows={2}
                          className={`${textareaCls} flex-1`}
                        />
                        <button type="button" onClick={() => {
                          const obs = (editedParsed.observacoes ?? []).filter((_, idx) => idx !== i);
                          setEditedParsed({ ...editedParsed, observacoes: obs.length ? obs : undefined });
                        }} className="text-red-400 hover:text-red-600 text-lg leading-none mt-1">×</button>
                      </>
                    ) : (
                      <span className="text-justify">{line}</span>
                    )}
                  </div>
                ))}
                {isEditing && (
                  <button type="button" onClick={() => setEditedParsed({ ...editedParsed, observacoes: [...(editedParsed.observacoes ?? []), ""] })} className="text-xs text-blue-600 hover:text-blue-700 mt-1">
                    + Adicionar linha
                  </button>
                )}
              </>
            )}

            {!editedParsed.sections.length && editedParsed.raw && (
              <div className="whitespace-pre-wrap">{editedParsed.raw}</div>
            )}
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">Imagens do exame</p>
              <div className="grid grid-cols-2 gap-4">
                {images.map((img) => (
                  <Image
                    key={img.id}
                    src={img.url}
                    alt={img.file_name}
                    width={600}
                    height={400}
                    className="w-full rounded-lg border border-gray-200 object-contain bg-black"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
