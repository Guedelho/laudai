"use client";

import { useState, useEffect } from "react";
import Typeahead from "@/components/Typeahead";
import EntityTypeahead from "@/components/EntityTypeahead";
import ImagePicker from "@/components/ImagePicker";
import { SparkleIcon } from "@/components/icons";
import Link from "next/link";
import { Pet, Client } from "@/shared/models";
import { SPECIES_OPTIONS, SEX_OPTIONS } from "@/shared/constants";
import { listPets } from "@/lib/services/pets";
import { listClients, createClient, addVet } from "@/lib/services/clients";
import { enqueueGeneration, uploadReportImages } from "@/lib/services/reports";
import { redirectToDashboard } from "@/app/actions/reports";
import { useDictation } from "@/lib/client/use-dictation";
import { inputCls, btnAssistant, btnBlock } from "@/lib/ui";
import { uniqueBreeds } from "@/lib/utils";

export default function NewReportPage() {
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

  // Client/vet
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [newClientName, setNewClientName] = useState("");
  const [selectedVetId, setSelectedVetId] = useState<string>("");
  const [newVetName, setNewVetName] = useState("");

  // Exam
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rawInput, setRawInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [imageWarningReportId, setImageWarningReportId] = useState<string | null>(null);

  // Images (selected before submit)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pickerKey, setPickerKey] = useState(0);

  const dictation = useDictation(setRawInput);

  useEffect(() => {
    async function loadData() {
      try {
        const [p, c] = await Promise.all([listPets(), listClients()]);
        setPets(p);
        setClients(c);
      } catch {
        setLoadError(true);
      }
    }
    loadData();
  }, []);

  function handlePetSelect(petId: string) {
    setSelectedPetId(petId);
    if (!petId) {
      setPatientName("");
      setSpecies("Canina");
      setBreed("");
      setAge("");
      setSex("M");
      setNeutered(false);
      setOwnerName("");
      return;
    }
    const pet = pets.find((p) => p.id === petId);
    if (pet) {
      setPatientName(pet.name);
      setSpecies(pet.species);
      setBreed(pet.breed);
      setAge(pet.age);
      setSex(pet.sex);
      setNeutered(pet.neutered);
      setOwnerName(pet.owner_name);
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const vets = selectedClient?.client_vets ?? [];
  const clientName = selectedClient?.name ?? newClientName;
  const responsibleVet = vets.find((v) => v.id === selectedVetId)?.name ?? newVetName;

  const breedSuggestions = uniqueBreeds(pets);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const required: [string, string][] = [
      [patientName, "Nome do paciente"],
      [ownerName, "Nome do responsável"],
      [breed, "Raça"],
      [age, "Idade"],
      [clientName, "Nome do cliente"],
      [responsibleVet, "Médico responsável"],
      [rawInput, "Achados do exame"],
    ];
    const missing = required.find(([v]) => !v.trim());
    if (missing) {
      setError(`${missing[1]} é obrigatório(a).`);
      return;
    }
    setSubmitting(true);

    try {
      let resolvedClientName = clientName;
      let resolvedVetName = responsibleVet;
      const resolvedPetId = selectedPetId || undefined;
      let resolvedClientId = selectedClientId || undefined;
      let resolvedVetId = selectedVetId || undefined;

      if (!selectedClientId && newClientName.trim()) {
        try {
          const { client, vet } = await createClient(newClientName.trim(), newVetName.trim());
          setClients((prev) => [...prev, client]);
          resolvedClientName = client.name;
          resolvedClientId = client.id;
          if (vet) {
            resolvedVetName = vet.name;
            resolvedVetId = vet.id;
          }
        } catch {
          /* non-blocking — continue with typed names */
        }
      } else if (selectedClientId && !selectedVetId && newVetName.trim()) {
        try {
          const vet = await addVet(selectedClientId, newVetName.trim());
          setClients((prev) =>
            prev.map((c) => (c.id === selectedClientId ? { ...c, client_vets: [...c.client_vets, vet] } : c)),
          );
          resolvedVetName = vet.name;
          resolvedVetId = vet.id;
        } catch {
          /* non-blocking — continue with typed names */
        }
      }

      const reportId = await enqueueGeneration({
        specialty,
        rawInput,
        patientName,
        species,
        breed,
        age,
        sex,
        neutered,
        ownerName,
        clientName: resolvedClientName,
        responsibleVet: resolvedVetName,
        examDate,
        petId: resolvedPetId,
        clientId: resolvedClientId,
        vetId: resolvedVetId,
      });

      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        try {
          await uploadReportImages(reportId, selectedFiles);
        } catch {
          setUploadingImages(false);
          setSubmitting(false);
          setImageWarningReportId(reportId);
          return;
        }
        setUploadingImages(false);
      }

      resetForm();
      await redirectToDashboard();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar laudo.");
      setSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedPetId("");
    setPatientName("");
    setSpecies("Canina");
    setBreed("");
    setAge("");
    setSex("M");
    setNeutered(false);
    setOwnerName("");
    setSelectedClientId("");
    setNewClientName("");
    setSelectedVetId("");
    setNewVetName("");
    setExamDate(new Date().toISOString().slice(0, 10));
    setRawInput("");
    setError("");
    setSelectedFiles([]);
    setPickerKey((k) => k + 1);
    dictation.reset();
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Laudos
        </Link>
        <Link href="/new/chat?laudo=1" className={btnAssistant}>
          <SparkleIcon className="h-4 w-4 shrink-0" />
          Gerar por conversa
        </Link>
      </div>

      {loadError && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800"
        >
          Não foi possível carregar seus pacientes e clientes. As sugestões podem estar indisponíveis.
        </p>
      )}

      {imageWarningReportId && (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900"
        >
          <p className="font-medium">Laudo criado, mas as imagens não foram enviadas.</p>
          <p className="mt-1">
            Abra o laudo para adicionar as imagens do exame:{" "}
            <Link href={`/report/${imageWarningReportId}`} className="font-medium text-blue-600 hover:underline">
              ver laudo
            </Link>
            .
          </p>
        </div>
      )}

      <form onSubmit={handleGenerate} className="space-y-6">
        {/* Client / Vet */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Cliente e responsável</p>
            <Link href="/clients" className="text-xs text-blue-600 hover:underline">
              Gerenciar clientes
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Cliente</label>
              <EntityTypeahead<Client>
                value={newClientName}
                onChange={setNewClientName}
                items={clients}
                getLabel={(c) => c.name}
                onPick={(c) => {
                  setSelectedClientId(c?.id ?? "");
                  setSelectedVetId("");
                  setNewVetName("");
                }}
                placeholder="Nome do cliente"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Médico responsável</label>
              <EntityTypeahead
                value={newVetName}
                onChange={setNewVetName}
                items={vets}
                getLabel={(v) => v.name}
                onPick={(v) => setSelectedVetId(v?.id ?? "")}
                placeholder="Nome do responsável"
                className={inputCls}
                required
              />
            </div>
          </div>
        </div>

        {/* Patient */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Paciente</p>
            <Link href="/pets" className="text-xs text-blue-600 hover:underline">
              Gerenciar pacientes
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Paciente</label>
              <EntityTypeahead<Pet>
                value={patientName}
                onChange={setPatientName}
                items={pets}
                getLabel={(p) => p.name}
                onPick={(p) => {
                  if (p) handlePetSelect(p.id);
                  else setSelectedPetId("");
                }}
                placeholder="Nome do paciente"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome do responsável</label>
              <input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Espécie</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                aria-label="Espécie"
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
              <label className="block text-xs text-gray-500 mb-1">Sexo</label>
              <select value={sex} onChange={(e) => setSex(e.target.value)} aria-label="Sexo" className={inputCls}>
                {SEX_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Raça</label>
              <Typeahead
                value={breed}
                onChange={setBreed}
                suggestions={breedSuggestions}
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Idade</label>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="ex: 3 anos"
                className={inputCls}
                required
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="neutered"
                type="checkbox"
                checked={neutered}
                onChange={(e) => setNeutered(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="neutered" className="text-sm text-gray-700">
                Castrado(a)
              </label>
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
            required
          />
        </div>

        {/* Findings */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-gray-700">Achados do exame</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => (dictation.listening ? dictation.stop() : dictation.start(rawInput, setError))}
              disabled={!dictation.supported}
              title={
                dictation.supported
                  ? undefined
                  : "Reconhecimento de voz indisponível neste navegador. Use Chrome, Edge ou Safari."
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                dictation.listening
                  ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {dictation.listening ? "Parar gravação" : "Gravar voz"}
            </button>
          </div>
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Descreva as alterações encontradas no exame..."
            rows={6}
            maxLength={2000}
            className={`${inputCls} resize-none`}
            required
          />
          <p className={`text-xs text-right ${rawInput.length >= 1800 ? "text-amber-600" : "text-gray-500"}`}>
            {rawInput.length}/2000
          </p>
        </div>

        <ImagePicker
          key={pickerKey}
          title="Imagens do exame"
          emptyText="Nenhuma imagem selecionada"
          onFilesChange={setSelectedFiles}
        />

        {(error || dictation.micPermissionError) && (
          <p className="text-sm text-red-600">{error || dictation.micPermissionError}</p>
        )}

        <button type="submit" disabled={submitting} className={`${btnBlock} flex items-center justify-center gap-2`}>
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{uploadingImages ? "Enviando imagens..." : "Enviando..."}</span>
            </>
          ) : (
            "Gerar laudo"
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          Dados do tutor e achados do exame são enviados ao Google (Gemini) para geração do laudo. Veja a{" "}
          <Link href="/legal/politica-de-privacidade" target="_blank" className="text-blue-600 hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </form>
    </main>
  );
}
