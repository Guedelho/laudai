import { Clinic, ClinicVet } from "@/shared/models";
import { ClinicResponse, ClinicsResponse, VetResponse } from "@/shared/interfaces";
import { fetchJson, fetchOk, jsonBody } from "@/lib/fetch";

export async function listClinics(): Promise<Clinic[]> {
  const data = await fetchJson<ClinicsResponse>("/api/clinics");
  return data.clinics ?? [];
}

export async function createClinic(name: string, vetName: string): Promise<{ clinic: Clinic; vet: ClinicVet | null }> {
  const data = await fetchJson<ClinicResponse>("/api/clinics", { method: "POST", ...jsonBody({ name, vetName }) });
  const vet = data.clinic.clinic_vets?.find((v) => v.name === vetName.trim()) ?? null;
  return { clinic: data.clinic, vet };
}

export async function renameClinic(id: string, name: string): Promise<Clinic> {
  const data = await fetchJson<ClinicResponse>(`/api/clinics/${id}`, { method: "PATCH", ...jsonBody({ name }) });
  return data.clinic;
}

export async function deleteClinic(id: string): Promise<void> {
  await fetchOk(`/api/clinics/${id}`, { method: "DELETE" });
}

export async function addVet(clinicId: string, name: string): Promise<ClinicVet> {
  const data = await fetchJson<VetResponse>(`/api/clinics/${clinicId}/vets`, {
    method: "POST",
    ...jsonBody({ name }),
  });
  return data.vet;
}

export async function removeVet(clinicId: string, vetId: string): Promise<void> {
  await fetchOk(`/api/clinics/${clinicId}/vets/${vetId}`, { method: "DELETE" });
}
