export type Specialty = "ultrasound_abdominal";

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
  clinicName: string;
  responsibleVet: string;
  examDate: string;
}

export interface Profile {
  id: string;
  full_name: string;
  crmv: string;
  cpf: string;
  created_at: string;
  logo_url?: string;
  signature_font?: string;
  signature?: string;
  signature_image_url?: string;
  crmv_state?: string;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
  owner_name: string;
  created_at: string;
}

export interface ClinicVet {
  id: string;
  clinic_id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Clinic {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  clinic_vets: ClinicVet[];
}

export const REPORT_STATUSES = {
  pending: "pending",
  generating: "generating",
  completed: "completed",
  failed: "failed",
} as const;

export type ReportStatus = (typeof REPORT_STATUSES)[keyof typeof REPORT_STATUSES];

export interface ReportSummary {
  id: string;
  patient_name: string;
  owner_name: string;
  clinic_name: string;
  specialty: Specialty;
  created_at: string;
  exam_date?: string;
  status: ReportStatus;
  error_message: string | null;
}

export interface Report {
  id: string;
  user_id: string;
  specialty: Specialty;
  patient_name: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
  owner_name: string;
  clinic_name: string;
  responsible_vet: string;
  raw_input: string;
  generated_content: string | null;
  edited_content: string | null;
  exam_date: string;
  pet_id: string | null;
  clinic_id: string | null;
  vet_id: string | null;
  status: ReportStatus;
  error_message: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ReportImage {
  id: string;
  file_name: string;
  url: string;
}
