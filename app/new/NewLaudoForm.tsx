"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Specialty, Pet } from "@/types";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { createClient } from "@/lib/supabase/client";

const SPECIALTIES = Object.entries(SPECIALTY_LABELS) as [Specialty, string][];

export default function NewLaudoPage() {
  const router = useRouter();
  const [specialty, setSpecialty] = useState<Specialty>("ultrasound_abdominal");
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [species, setSpecies] = useState("Canino");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [rawInput, setRawInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    async function loadPets() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/pets", {
        headers: session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setPets(data.pets ?? []);
      }
    }
    loadPets();
  }, []);

  function handlePetSelect(petId: string) {
    setSelectedPetId(petId);
    if (!petId) {
      setPatientName("");
      setSpecies("Canino");
      setBreed("");
      setAge("");
      setOwnerName("");
      return;
    }
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      setPatientName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed ?? "");
      setAge(pet.age ?? "");
      setOwnerName(pet.owner_name);
    }
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;
    chunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      await transcribeAudio(blob);
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
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          specialty,
          rawInput,
          patientName,
          species,
          breed,
          age,
          ownerName,
          petId: selectedPetId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/laudai/${data.laudo.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar laudo.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-lg font-bold text-gray-900">Novo Laudo</h1>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <form onSubmit={handleGenerate} className="space-y-6">

          {/* Specialty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
            <div className="grid grid-cols-2 gap-2">
              {SPECIALTIES.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSpecialty(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    specialty === key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Pet selector */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Paciente</p>
              <a href="/pets" className="text-xs text-blue-600 hover:underline">
                Gerenciar pacientes
              </a>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Selecionar paciente cadastrado</label>
              <select
                value={selectedPetId}
                onChange={(e) => handlePetSelect(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
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
                <label className="block text-xs text-gray-500 mb-1">Nome do animal</label>
                <input
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Tutor</label>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Espécie</label>
                <select
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Canino</option>
                  <option>Felino</option>
                  <option>Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Raça</label>
                <input
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Idade</label>
                <input
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="ex: 3 anos"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Findings input */}
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
              placeholder="Informe apenas as alterações encontradas... ex: fígado aumentado com ecotextura heterogênea, rim direito medindo 4,2cm. Deixe em branco para gerar laudo normal."
              rows={6}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              required
            />
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
