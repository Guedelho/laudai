"use client";

import { useState, useRef, useEffect } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import ImageLightbox from "@/components/ImageLightbox";
import Typeahead from "@/components/Typeahead";
import EntityTypeahead from "@/components/EntityTypeahead";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pet, Clinic } from "@/shared/models";
import { SPECIES_OPTIONS, SEX_OPTIONS, MAX_REPORT_IMAGES, MAX_IMAGE_FILE_SIZE } from "@/shared/constants";
import { listPets } from "@/lib/services/pets";
import { listClinics, createClinic, addVet } from "@/lib/services/clinics";
import { enqueueGeneration, uploadReportImages } from "@/lib/services/reports";
import { useIsClient } from "@/lib/use-is-client";

export default function NewReportPage() {
  const router = useRouter();
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
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState("");

  // Images (selected before submit)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    objectUrlsRef.current = objectUrls;
  }, [objectUrls]);

  // Revoke all remaining URLs only on unmount, not on every change.
  // removeFile() already revokes individual URLs when they're removed.
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach(URL.revokeObjectURL);
    };
  }, []);

  const liveAnchorRef = useRef<string>("");
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition, isMicrophoneAvailable } =
    useSpeechRecognition();

  // react-speech-recognition reads window.SpeechRecognition at module-load
  // time. Under Next.js SSR that's undefined, so the hook's first render
  // returns false even on Chrome/Safari. Defer the support check until after
  // hydration so the button doesn't paint disabled for a frame on supported
  // browsers.
  const isClient = useIsClient();
  const speechSupported = !isClient || browserSupportsSpeechRecognition;
  const micPermissionError =
    isClient && !isMicrophoneAvailable
      ? "Permissão para microfone negada. Habilite o microfone nas configurações do navegador."
      : "";

  useEffect(() => {
    if (!listening && !transcript) return;
    const anchor = liveAnchorRef.current;
    const live = transcript.trim();
    setRawInput(anchor + (anchor && live ? " " : "") + live);
  }, [transcript, listening]);

  useEffect(() => {
    async function loadData() {
      const [p, c] = await Promise.all([listPets(), listClinics()]);
      setPets(p);
      setClinics(c);
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const valid = files.filter((f) => {
      if (f.size > MAX_IMAGE_FILE_SIZE) {
        setError(`Imagem "${f.name}" excede 5 MB.`);
        return false;
      }
      return true;
    });
    if (!valid.length) return;
    const remaining = MAX_REPORT_IMAGES - selectedFiles.length;
    if (remaining <= 0) {
      setError(`Limite de ${MAX_REPORT_IMAGES} imagens atingido.`);
      if (imageInputRef.current) imageInputRef.current.value = "";
      return;
    }
    const capped = valid.slice(0, remaining);
    if (capped.length < valid.length) {
      setError(
        `Limite de ${MAX_REPORT_IMAGES} imagens. Apenas ${capped.length} adicionada${capped.length !== 1 ? "s" : ""}.`,
      );
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
    setError("");
    if (!browserSupportsSpeechRecognition) {
      setError("Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.");
      return;
    }
    liveAnchorRef.current = rawInput;
    resetTranscript();
    // First call triggers the browser's native mic-permission prompt. If the
    // user denies, isMicrophoneAvailable flips false and the effect above
    // surfaces the Portuguese error.
    try {
      await SpeechRecognition.startListening({ language: "pt-BR", continuous: true });
    } catch {
      setError("Não foi possível acessar o microfone.");
    }
  }

  async function stopRecording() {
    await SpeechRecognition.stopListening();
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const required: [string, string][] = [
      [patientName, "Nome do paciente"],
      [ownerName, "Nome do responsável"],
      [breed, "Raça"],
      [age, "Idade"],
      [clinicName, "Nome da clínica"],
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
      let resolvedClinicName = clinicName;
      let resolvedVetName = responsibleVet;
      const resolvedPetId = selectedPetId || undefined;
      let resolvedClinicId = selectedClinicId || undefined;
      let resolvedVetId = selectedVetId || undefined;

      if (!selectedClinicId && newClinicName.trim()) {
        try {
          const { clinic, vet } = await createClinic(newClinicName.trim(), newVetName.trim());
          setClinics((prev) => [...prev, clinic]);
          resolvedClinicName = clinic.name;
          resolvedClinicId = clinic.id;
          if (vet) {
            resolvedVetName = vet.name;
            resolvedVetId = vet.id;
          }
        } catch {
          /* non-blocking — continue with typed names */
        }
      } else if (selectedClinicId && !selectedVetId && newVetName.trim()) {
        try {
          const vet = await addVet(selectedClinicId, newVetName.trim());
          setClinics((prev) =>
            prev.map((c) => (c.id === selectedClinicId ? { ...c, clinic_vets: [...c.clinic_vets, vet] } : c)),
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
        clinicName: resolvedClinicName,
        responsibleVet: resolvedVetName,
        examDate,
        petId: resolvedPetId,
        clinicId: resolvedClinicId,
        vetId: resolvedVetId,
      });

      if (selectedFiles.length > 0) {
        setUploadingImages(true);
        try {
          await uploadReportImages(reportId, selectedFiles);
        } catch (err) {
          console.error("Image upload failed:", err);
        }
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar laudo.");
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

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
            <a href="/clinics" className="text-xs text-blue-600 hover:underline">
              Gerenciar clínicas
            </a>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Clínica</label>
              <EntityTypeahead<Clinic>
                value={newClinicName}
                onChange={setNewClinicName}
                items={clinics}
                getLabel={(c) => c.name}
                onPick={(c) => {
                  setSelectedClinicId(c?.id ?? "");
                  setSelectedVetId("");
                  setNewVetName("");
                }}
                placeholder="Nome da clínica"
                className={inputCls}
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Médico Responsável</label>
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
            <a href="/pets" className="text-xs text-blue-600 hover:underline">
              Gerenciar pacientes
            </a>
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
              <select value={species} onChange={(e) => setSpecies(e.target.value)} className={inputCls}>
                {SPECIES_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sexo</label>
              <select value={sex} onChange={(e) => setSex(e.target.value)} className={inputCls}>
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
          <p className="text-sm font-semibold text-gray-700">Achados do Exame</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={listening ? stopRecording : startRecording}
              disabled={!speechSupported}
              title={
                speechSupported
                  ? undefined
                  : "Reconhecimento de voz indisponível neste navegador. Use Chrome, Edge ou Safari."
              }
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                listening
                  ? "bg-red-500 text-white border-red-500 hover:bg-red-600"
                  : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {listening ? "Parar gravação" : "Gravar voz"}
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
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
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

        {(error || micPermissionError) && <p className="text-sm text-red-500">{error || micPermissionError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{uploadingImages ? "Enviando imagens..." : "Enviando..."}</span>
            </>
          ) : (
            "Gerar Laudo"
          )}
        </button>
      </form>
    </main>
  );
}
