"use client";

import { useState, useRef, useEffect } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import Typeahead from "@/components/Typeahead";
import Link from "next/link";
import { Pet, Clinic, ParsedLaudo, SseEvent, SPECIES_OPTIONS, SEX_OPTIONS } from "@/types";
import { getAuthHeaders } from "@/lib/supabase/client";
import { parseLaudoContent } from "@/lib/parseLaudo";
import LaudoReviewPanel from "./LaudoReviewPanel";

export default function NewLaudoPage() {
  const specialty = "ultrasound_abdominal" as const;

  // Pets
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  // Patient fields
  const [patientName, setPatientName] = useState("");
  const [species, setSpecies] = useState("Canina");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("M");
  const [neutered, setNeutered] = useState(false);
  const [ownerName, setOwnerName] = useState("");

  // Clinic/vet
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [newClinicName, setNewClinicName] = useState("");
  const [selectedVetId, setSelectedVetId] = useState<string>("");
  const [newVetName, setNewVetName] = useState("");

  // Exam
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rawInput, setRawInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStatus, setGeneratingStatus] = useState("Gerando laudo...");
  const [error, setError] = useState("");

  // Images (selected before submit)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);
  objectUrlsRef.current = objectUrls;

  // Revoke all remaining URLs only on unmount, not on every change.
  // removeFile() already revokes individual URLs when they're removed.
  useEffect(() => {
    return () => { objectUrlsRef.current.forEach(URL.revokeObjectURL); };
  }, []);


  // Review phase
  const [phase, setPhase] = useState<"form" | "review">("form");
  const [reviewLaudoId, setReviewLaudoId] = useState("");
  const [reviewParsed, setReviewParsed] = useState<ParsedLaudo | null>(null);
  const [reviewCreatedAt, setReviewCreatedAt] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function loadData() {
      const headers = await getAuthHeaders();
      const [petsRes, clinicsRes] = await Promise.all([
        fetch("/api/pets", { headers }),
        fetch("/api/clinics", { headers }),
      ]);
      if (petsRes.ok) setPets((await petsRes.json()).pets ?? []);
      if (clinicsRes.ok) setClinics((await clinicsRes.json()).clinics ?? []);
      setLoadingData(false);
    }
    loadData();
  }, []);

  function handlePetSelect(petId: string) {
    setSelectedPetId(petId);
    if (!petId) {
      setPatientName(""); setSpecies("Canina"); setBreed(""); setAge(""); setSex(""); setOwnerName("");
      return;
    }
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      setPatientName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed ?? "");
      setAge(pet.age ?? "");
      setSex(pet.sex);
      setNeutered(pet.neutered);
      setOwnerName(pet.owner_name);
    }
  }

  function handleClinicSelect(clinicId: string) {
    setSelectedClinicId(clinicId);
    setSelectedVetId("");
    setNewVetName("");
    setNewClinicName("");
  }

  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const valid = files.filter((f) => {
      if (f.size > MAX_IMAGE_SIZE) {
        setError(`Imagem "${f.name}" excede 10 MB.`);
        return false;
      }
      return true;
    });
    if (!valid.length) return;
    const remaining = 30 - selectedFiles.length;
    if (remaining <= 0) {
      setError("Limite de 30 imagens atingido.");
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    const capped = valid.slice(0, remaining);
    if (capped.length < valid.length) {
      setError(`Limite de 30 imagens. Apenas ${capped.length} adicionada${capped.length !== 1 ? "s" : ""}.`);
    }
    setSelectedFiles((prev) => [...prev, ...capped]);
    setObjectUrls((prev) => [...prev, ...capped.map((f) => URL.createObjectURL(f))]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(objectUrls[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setObjectUrls((prev) => prev.filter((_, i) => i !== index));
    if (lightboxIndex !== null) {
      if (index === lightboxIndex) setLightboxIndex(null);
      else if (index < lightboxIndex) setLightboxIndex(lightboxIndex - 1);
    }
  }

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId);
  const vets = selectedClinic?.clinic_vets ?? [];
  const clinicName = selectedClinic?.name ?? newClinicName;
  const responsibleVet = vets.find((v) => v.id === selectedVetId)?.name ?? newVetName;

  const breedSuggestions = [...new Set(pets.map((p) => p.breed).filter(Boolean) as string[])].sort();

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await transcribeAudio(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        setError("Permissão para microfone negada. Habilite o microfone nas configurações do navegador.");
      } else {
        setError("Não foi possível acessar o microfone.");
      }
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribeAudio(blob: Blob) {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: await getAuthHeaders(),
        body: formData,
      });
      const data = await res.json();
      setRawInput((prev) => prev + (prev ? " " : "") + data.text);
    } catch {
      setError("Erro ao transcrever áudio.");
    } finally {
      setTranscribing(false);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!patientName.trim()) { setError("Nome do paciente é obrigatório."); return; }
    if (!ownerName.trim()) { setError("Nome do responsável é obrigatório."); return; }
    if (!rawInput.trim()) { setError("Achados do exame são obrigatórios."); return; }
    setGenerating(true);
    setGeneratingStatus("Gerando laudo...");

    try {
      const headers = { "Content-Type": "application/json", ...(await getAuthHeaders()) };

      let resolvedClinicName = clinicName;
      let resolvedVetName = responsibleVet;

      if (!selectedClinicId && newClinicName.trim()) {
        const res = await fetch("/api/clinics", {
          method: "POST",
          headers,
          body: JSON.stringify({ name: newClinicName.trim(), vetName: newVetName.trim() || undefined }),
        });
        if (res.ok) {
          const data = await res.json();
          setClinics((prev) => [...prev, data.clinic]);
          resolvedClinicName = data.clinic.name;
          if (data.clinic.clinic_vets?.[0]) resolvedVetName = data.clinic.clinic_vets[0].name;
        }
      } else if (selectedClinicId && !selectedVetId && newVetName.trim()) {
        const res = await fetch(`/api/clinics/${selectedClinicId}/vets`, {
          method: "POST",
          headers,
          body: JSON.stringify({ name: newVetName.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          setClinics((prev) => prev.map((c) =>
            c.id === selectedClinicId
              ? { ...c, clinic_vets: [...c.clinic_vets, data.vet] }
              : c
          ));
          resolvedVetName = data.vet.name;
        }
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify({
          specialty, rawInput, patientName, species, breed, age,
          sex,
          neutered,
          ownerName, clinicName: resolvedClinicName || undefined,
          responsibleVet: resolvedVetName || undefined,
          examDate: examDate || undefined,
          petId: selectedPetId || undefined,
        }),
      });

      if (!res.ok) {
        let data: { error?: string } = {};
        try { data = await res.json(); } catch { /* ignore */ }
        throw new Error(data.error || "Erro ao gerar laudo.");
      }

      // Consume SSE stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let laudoPayload: { id: string; generated_content: string; created_at: string } | null = null;

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const event: SseEvent = JSON.parse(line.slice(6));
          if (event.status === "generating") setGeneratingStatus("Gerando laudo...");
          else if (event.status === "reviewing") setGeneratingStatus("Revisando laudo...");
          else if (event.status === "saving") setGeneratingStatus("Salvando...");
          else if (event.status === "error") throw new Error(event.message || "Erro ao gerar laudo.");
          else if (event.status === "done") { laudoPayload = event.laudo; break outer; }
        }
      }

      if (!laudoPayload) throw new Error("Erro ao gerar laudo. Tente novamente.");
      const laudoId = laudoPayload.id;

      // Upload images if any
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((f) => formData.append("images", f));
        const imgRes = await fetch(`/api/laudos/${laudoId}/images`, { method: "POST", headers: await getAuthHeaders(), body: formData });
        if (!imgRes.ok) {
          let imgData: { error?: string } = {};
          try { imgData = await imgRes.json(); } catch { /* ignore */ }
          throw new Error(imgData.error || "Erro ao enviar imagens.");
        }
      }

      // Switch to review phase
      setReviewLaudoId(laudoId);
      setReviewParsed(parseLaudoContent(laudoPayload.generated_content));
      setReviewCreatedAt(laudoPayload.created_at);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar laudo.");
    } finally {
      setGenerating(false);
    }
  }

  // Review phase
  if (phase === "review" && reviewParsed) {
    return (
      <LaudoReviewPanel
        laudoId={reviewLaudoId}
        initialParsed={reviewParsed}
        initialFields={{
          patientName,
          species,
          breed,
          age,
          sex,
          neutered,
          ownerName,
          clinicName,
          responsibleVet,
          examDate,
          createdAt: reviewCreatedAt,
        }}
      />
    );
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-6 inline-block">
        ← Laudos
      </Link>
      <form onSubmit={handleGenerate} className="space-y-6">

          {/* Clinic / Vet */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Clínica e Responsável</p>
              <a href="/clinics" className="text-xs text-blue-600 hover:underline">Gerenciar clínicas</a>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Selecionar clínica cadastrada</label>
              {loadingData ? (
                <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <select value={selectedClinicId} onChange={(e) => handleClinicSelect(e.target.value)} className={inputCls}>
                  <option value="">— Nova clínica —</option>
                  {clinics.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome da clínica</label>
                <input
                  value={selectedClinicId && selectedClinicId !== "new" ? selectedClinic?.name ?? "" : newClinicName}
                  onChange={(e) => setNewClinicName(e.target.value)}
                  disabled={!!selectedClinicId && selectedClinicId !== "new"}
                  placeholder="Nome da clínica"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Médico Responsável</label>
                {selectedClinicId && selectedClinicId !== "new" && vets.length > 0 ? (
                  <>
                    <select value={selectedVetId} onChange={(e) => setSelectedVetId(e.target.value)} className={inputCls}>
                      <option value="">— Novo responsável —</option>
                      {vets.map((v) => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                      ))}
                    </select>
                    {selectedVetId === "" && (
                      <input
                        value={newVetName}
                        onChange={(e) => setNewVetName(e.target.value)}
                        placeholder="Nome do responsável"
                        className={`${inputCls} mt-2`}
                      />
                    )}
                  </>
                ) : (
                  <input
                    value={newVetName}
                    onChange={(e) => setNewVetName(e.target.value)}
                    placeholder="Nome do responsável"
                    className={inputCls}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Patient */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Paciente</p>
              <a href="/pets" className="text-xs text-blue-600 hover:underline">Gerenciar pacientes</a>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Selecionar paciente cadastrado</label>
              {loadingData ? (
                <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <select value={selectedPetId} onChange={(e) => handlePetSelect(e.target.value)} className={inputCls}>
                  <option value="">— Novo paciente —</option>
                  {pets.map((pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species}) · {pet.owner_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Paciente</label>
                <input value={patientName} onChange={(e) => setPatientName(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Nome do responsável</label>
                <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Espécie</label>
                <select value={species} onChange={(e) => setSpecies(e.target.value)} className={inputCls}>
                  {SPECIES_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sexo</label>
                <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputCls}>
                  {SEX_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Castrado(a)</label>
                <select
                  value={neutered ? "true" : "false"}
                  onChange={(e) => setNeutered(e.target.value === "true")}
                  className={inputCls}
                >
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Raça</label>
                <Typeahead value={breed} onChange={setBreed} suggestions={breedSuggestions} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Idade</label>
                <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="ex: 3 anos" className={inputCls} />
              </div>
            </div>
          </div>

          {/* Exam date */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Data do exame</label>
            <input
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Findings */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-700">Achados do Exame</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                disabled={transcribing}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  recording
                    ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {recording ? "Parar gravação" : transcribing ? "Transcrevendo..." : "Gravar voz"}
              </button>
            </div>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="Informe apenas as alterações encontradas... Deixe em branco para gerar laudo normal."
              rows={6}
              maxLength={2000}
              className={`${inputCls} resize-none`}
              required
            />
            <p className={`text-xs text-right ${rawInput.length >= 1800 ? "text-amber-500" : "text-gray-400"}`}>
              {rawInput.length}/2000
            </p>
          </div>

          {/* Images */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                Imagens do exame
                {selectedFiles.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-gray-400">{selectedFiles.length}/30</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={selectedFiles.length >= 30}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Adicionar imagens
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            </div>
            {selectedFiles.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {selectedFiles.map((file, i) => (
                  <div key={objectUrls[i]} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={objectUrls[i]}
                      alt={file.name}
                      onClick={() => setLightboxIndex(i)}
                      className="w-full aspect-[4/3] object-cover rounded-lg border border-gray-200 bg-black cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Nenhuma imagem selecionada</p>
            )}
            {lightboxIndex !== null && (
              <ImageLightbox
                images={objectUrls.map((url) => ({ key: url, src: url }))}
                selectedIndex={lightboxIndex}
                onClose={() => setLightboxIndex(null)}
              />
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={generating}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Aguarde..." : "Gerar Laudo"}
          </button>
          {generating && (
            <p className="text-center text-sm text-gray-500 animate-pulse">{generatingStatus}</p>
          )}
        </form>
      </main>
  );
}
