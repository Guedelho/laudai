"use client";

import { useState } from "react";
import { Report, ParsedReport, Pet, Client, ClientVet } from "@/shared/models";
import { parseReportContent } from "@/lib/utils";
import { updateReport } from "@/lib/services/reports";
import { openReportPdfTab } from "@/lib/pdf-tab";

export type ReportFieldsState = {
  patientName: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
  ownerName: string;
  clientName: string;
  responsibleVet: string;
  examDate: string;
};

type ListKey = "impression" | "recommendations" | "observations";

export function useReportEditor(report: Report, onAfterImprimir: () => void) {
  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editedParsed, setEditedParsed] = useState<ParsedReport>(parseReportContent(report.edited_content!));
  const [fields, setFields] = useState<ReportFieldsState>({
    patientName: report.patient_name,
    species: report.species,
    breed: report.breed,
    age: report.age,
    sex: report.sex,
    neutered: report.neutered,
    ownerName: report.owner_name,
    clientName: report.client_name,
    responsibleVet: report.responsible_vet,
    examDate: report.exam_date,
  });
  const [selectedPetId, setSelectedPetId] = useState<string | null>(report.pet_id);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(report.client_id);
  const [selectedVetId, setSelectedVetId] = useState<string | null>(report.vet_id);

  function selectPet(pet: Pet | null) {
    setSelectedPetId(pet?.id ?? null);
    if (!pet) return;
    setFields((prev) => ({
      ...prev,
      patientName: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      sex: pet.sex,
      neutered: pet.neutered,
      ownerName: pet.owner_name,
    }));
  }

  function selectClient(client: Client | null) {
    setSelectedClientId(client?.id ?? null);
    setSelectedVetId(null);
    if (!client) return;
    setFields((prev) => ({ ...prev, clientName: client.name }));
  }

  function selectVet(vet: ClientVet | null) {
    setSelectedVetId(vet?.id ?? null);
    if (!vet) return;
    setFields((prev) => ({ ...prev, responsibleVet: vet.name }));
  }

  function updateSection(i: number, value: string) {
    const sections = [...editedParsed.sections];
    sections[i] = { ...sections[i], content: value };
    setEditedParsed({ ...editedParsed, sections });
  }

  function removeSection(i: number) {
    const sections = editedParsed.sections.filter((_, idx) => idx !== i);
    setEditedParsed({ ...editedParsed, sections });
  }

  function updateList(key: ListKey, i: number, value: string) {
    const list = [...(editedParsed[key] ?? [])];
    list[i] = value;
    setEditedParsed({ ...editedParsed, [key]: list });
  }

  function addToList(key: ListKey) {
    setEditedParsed({ ...editedParsed, [key]: [...(editedParsed[key] ?? []), ""] });
  }

  function removeFromList(key: ListKey, i: number) {
    const list = (editedParsed[key] ?? []).filter((_, idx) => idx !== i);
    setEditedParsed({ ...editedParsed, [key]: list.length ? list : undefined });
  }

  async function persistReport() {
    await updateReport(report.id, {
      generatedContent: editedParsed,
      patientFields: {
        patient_name: fields.patientName,
        species: fields.species,
        breed: fields.breed,
        age: fields.age,
        sex: fields.sex,
        neutered: fields.neutered,
        owner_name: fields.ownerName,
        client_name: fields.clientName,
        responsible_vet: fields.responsibleVet,
        exam_date: fields.examDate,
      },
      petId: selectedPetId ?? undefined,
      clientId: selectedClientId ?? undefined,
      vetId: selectedVetId ?? undefined,
    });
  }

  async function handleSalvar() {
    setSaving(true);
    setError("");
    try {
      await persistReport();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleImprimir() {
    setPrinting(true);
    setError("");
    try {
      await persistReport();
      openReportPdfTab(report.id);
      onAfterImprimir();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao imprimir.");
    } finally {
      setPrinting(false);
    }
  }

  return {
    fields,
    setFields,
    editedParsed,
    setEditedParsed,
    selectedPetId,
    selectedClientId,
    selectedVetId,
    selectPet,
    selectClient,
    selectVet,
    updateSection,
    removeSection,
    updateList,
    addToList,
    removeFromList,
    saving,
    printing,
    error,
    handleSalvar,
    handleImprimir,
  };
}
