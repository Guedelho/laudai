"use client";

import { useState } from "react";
import { Report, ParsedReport, Pet, Clinic, ClinicVet } from "@/shared/models";
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
  clinicName: string;
  responsibleVet: string;
  examDate: string;
};

type ListKey = "impression" | "recommendations" | "observations";

export function useReportEditor(report: Report, onAfterImprimir: () => void) {
  const [printing, setPrinting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editedParsed, setEditedParsed] = useState<ParsedReport>(parseReportContent(report.edited_content));
  const [fields, setFields] = useState<ReportFieldsState>({
    patientName: report.patient_name,
    species: report.species,
    breed: report.breed,
    age: report.age,
    sex: report.sex,
    neutered: report.neutered,
    ownerName: report.owner_name,
    clinicName: report.clinic_name,
    responsibleVet: report.responsible_vet,
    examDate: report.exam_date,
  });
  const [selectedPetId, setSelectedPetId] = useState<string | null>(report.pet_id);
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(report.clinic_id);
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

  function selectClinic(clinic: Clinic | null) {
    setSelectedClinicId(clinic?.id ?? null);
    setSelectedVetId(null);
    if (!clinic) return;
    setFields((prev) => ({ ...prev, clinicName: clinic.name }));
  }

  function selectVet(vet: ClinicVet | null) {
    setSelectedVetId(vet?.id ?? null);
    if (!vet) return;
    setFields((prev) => ({ ...prev, responsibleVet: vet.name }));
  }

  function updateSection(i: number, value: string) {
    const sections = [...editedParsed.sections];
    sections[i] = { ...sections[i], content: value };
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
        clinic_name: fields.clinicName,
        responsible_vet: fields.responsibleVet,
        exam_date: fields.examDate,
      },
      petId: selectedPetId ?? undefined,
      clinicId: selectedClinicId ?? undefined,
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
    selectedClinicId,
    selectedVetId,
    selectPet,
    selectClinic,
    selectVet,
    updateSection,
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
