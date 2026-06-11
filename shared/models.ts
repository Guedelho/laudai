import type { ReportType, ReportStatus } from "@/shared/constants";

export interface ReportSection {
  label: string;
  content: string;
}

export interface ParsedReport {
  sections: ReportSection[];
  conclusion?: string;
  impression?: string[];
  recommendations?: string[];
  observations?: string[];
  raw?: string;
}

export interface PatientFields {
  patientName: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
  ownerName: string;
}

export interface ReportFields extends PatientFields {
  clientName: string;
  responsibleVet: string;
  examDate: string;
}

export interface Profile {
  id: string;
  full_name: string;
  crmv: string;
  crmv_state: string;
  cpf: string;
  created_at: string;
  signature_font: string | null;
  signature: string | null;
  signature_image_url: string | null;
  deletion_scheduled_at: string | null;
}

export interface Pet {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
  owner_name: string;
  created_at: string;
}

export interface ClientVet {
  id: string;
  client_id: string;
  user_id: string;
  org_id: string;
  name: string;
  created_at: string;
}

export interface Client {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  created_at: string;
  client_vets: ClientVet[];
}

export interface ReportSummary {
  id: string;
  patient_name: string;
  owner_name: string;
  client_name: string;
  specialty: ReportType;
  created_at: string;
  exam_date?: string;
  status: ReportStatus;
  error_message: string | null;
}

export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
  seq: number;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  org_id: string;
  specialty: ReportType;
  patient_name: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
  owner_name: string;
  client_name: string;
  responsible_vet: string;
  raw_input: string;
  generated_content: string | null;
  edited_content: string | null;
  exam_date: string;
  pet_id: string | null;
  client_id: string | null;
  vet_id: string | null;
  status: ReportStatus;
  error_message: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  pdf_storage_path: string | null;
  pdf_cached_at: string | null;
  updated_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface ReportImage {
  id: string;
  file_name: string;
  url: string;
}
