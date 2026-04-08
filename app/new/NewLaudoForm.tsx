"use client";

import { useState, useRef, useEffect } from "react";
import { Pet, Clinic, ParsedLaudo } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { parseLaudoContent } from "@/lib/parseLaudo";
import LaudoReviewPanel from "./LaudoReviewPanel";

export default function NewLaudoPage() {
  const specialty = "ultrasound_abdominal" as const;

  // Pets
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");

  // Patient fields
  const [patientName, setPatientName] = useState("");
  const [species, setSpecies] = useState("Canino");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [neutered, setNeutered] = useState<boolean | null>(null);
  const [ownerName, setOwnerName] = useState("");

  // Clinic/vet
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [newClinicName, setNewClinicName] = useState("");
  const [selectedVetId, setSelectedVetId] = useState<string>("");
  const [newVetName, setNewVetName] = useState("");

  // Exam
  const [rawInput, setRawInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  // Images (selected before submit)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Review phase
  const [phase, setPhase] = useState<"form" | "review">("form");
  const [reviewLaudoId, setReviewLaudoId] = useState("");
  const [reviewParsed, setReviewParsed] = useState<ParsedLaudo | null>(null);
  const [reviewCreatedAt, setReviewCreatedAt] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {};
      const [petsRes, clinicsRes] = await Promise.all([
        fetch("/api/pets", { headers }),
        fetch("/api/clinics", { headers }),
      ]);
      if (petsRes.ok) setPets((await petsRes.json()).pets ?? []);
      if (clinicsRes.ok) setClinics((await clinicsRes.json()).clinics ?? []);
    }
    loadData();
  }, []);

  function handlePetSelect(petId: string) {
    setSelectedPetId(petId);
    if (!petId) {
      setPatientName(""); setSpecies("Canino"); setBreed(""); setAge(""); setSex(""); setOwnerName("");
      return;
    }
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      setPatientName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed ?? "");
      setAge(pet.age ?? "");
      setSex(pet.sex ?? "");
      setNeutered(pet.neutered ?? null);
      setOwnerName(pet.owner_name);
    }
  }

  function handleClinicSelect(clinicId: string) {
    setSelectedClinicId(clinicId);
    setSelectedVetId("");
    setNewVetName("");
    setNewClinicName("");
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function removeFile(index: number) {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }

  const selectedClinic = clinics.find((c) => c.id === selectedClinicId);
  const vets = selectedClinic?.clinic_vets ?? [];
  const clinicName = selectedClinic?.name ?? newClinicName;
  const responsibleVet = vets.find((v) => v.id === selectedVetId)?.name ?? newVetName;

  async function getAuthHeaders() {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return {
      "Content-Type": "application/json",
      ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
    };
  }

  async function startRecording() {
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
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribeAudio(blob: Blob) {
    setTranscribing(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {},
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
    setGenerating(true);
    setError("");

    try {
      const headers = await getAuthHeaders();

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
          sex: sex || undefined,
          neutered: neutered ?? undefined,
          ownerName, clinicName: resolvedClinicName || undefined,
          responsibleVet: resolvedVetName || undefined,
          petId: selectedPetId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const laudoId = data.laudo.id;

      // Upload images if any
      if (selectedFiles.length > 0) {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        const authHeader: Record<string, string> = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
        const formData = new FormData();
        selectedFiles.forEach((f) => formData.append("images", f));
        await fetch(`/api/laudos/${laudoId}/images`, { method: "POST", headers: authHeader, body: formData });
      }

      // Switch to review phase
      setReviewLaudoId(laudoId);
      setReviewParsed(parseLaudoContent(data.laudo.generated_content));
      setReviewCreatedAt(data.laudo.created_at);
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
          createdAt: reviewCreatedAt,
        }}
      />
    );
  }

  const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Novo Laudo</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleGenerate} className="space-y-6">

          {/* Clinic / Vet */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Clínica e Responsável</p>
              <a href="/clinics" className="text-xs text-blue-600 hover:underline">Gerenciar clínicas</a>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Selecionar clínica cadastrada</label>
              <select value={selectedClinicId} onChange={(e) => handleClinicSelect(e.target.value)} className={inputCls}>
                <option value="">— Nova clínica —</option>
                {clinics.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
              <select value={selectedPetId} onChange={(e) => handlePetSelect(e.target.value)} className={inputCls}>
                <option value="">— Novo paciente —</option>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.species}) · {pet.owner_name}
                  </option>
                ))}
              </select>
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
                  <option value="Canino">Canino</option>
                  <option value="Felino">Felino</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Sexo</label>
                <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputCls}>
                  <option value="">Não informado</option>
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Castrado(a)</label>
                <select
                  value={neutered === null ? "" : neutered ? "true" : "false"}
                  onChange={(e) => setNeutered(e.target.value === "" ? null : e.target.value === "true")}
                  className={inputCls}
                >
                  <option value="">Não informado</option>
                  <option value="false">Não</option>
                  <option value="true">Sim</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Raça</label>
                <input value={breed} onChange={(e) => setBreed(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Idade</label>
                <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="ex: 3 anos" className={inputCls} />
              </div>
            </div>
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
              className={`${inputCls} resize-none`}
              required
            />
          </div>

          {/* Images */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Imagens do exame</p>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Adicionar imagens
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            </div>
            {selectedFiles.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {selectedFiles.map((file, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200 bg-black"
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
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={generating}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {generating ? "Gerando laudo..." : "Gerar Laudo"}
          </button>
        </form>
      </main>
    </div>
  );
}
