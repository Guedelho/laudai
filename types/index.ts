export type Specialty = "ultrasound_abdominal";

// ─── Dropdown options ────────────────────────────────────────────────────────

export const SPECIES_OPTIONS = [
  { value: "Canina", label: "Canina" },
  { value: "Felina", label: "Felina" },
] as const;

export const SEX_OPTIONS = [
  { value: "M", label: "Macho" },
  { value: "F", label: "Fêmea" },
] as const;

export function sexLabel(value: string): string {
  return SEX_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

// ─── Parsed laudo content ────────────────────────────────────────────────────

export interface LaudoSection {
  label: string;
  content: string;
}

export interface ParsedLaudo {
  sections: LaudoSection[];
  conclusion?: string;
  impressao?: string[];
  recomendacoes?: string[];
  observacoes?: string[];
  raw?: string;
}

// ─── Shared field sets ───────────────────────────────────────────────────────

export interface PatientFields {
  patientName: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
  ownerName: string;
}

export interface LaudoFields extends PatientFields {
  clinicName: string;
  responsibleVet: string;
  examDate: string;
}

// ─── DB row models ───────────────────────────────────────────────────────────

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

export interface Laudo {
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
  generated_content: string;
  edited_content: string;
  exam_date: string;
  created_at: string;
  updated_at?: string;
  pet_id?: string;
}

export interface LaudoImage {
  id: string;
  file_name: string;
  url: string;
}

// ─── API request/response types ──────────────────────────────────────────────

export interface GenerateRequest extends LaudoFields {
  specialty: Specialty;
  rawInput: string;
  petId?: string;
}

export interface PetRequest {
  name: string;
  species: string;
  breed: string;
  age: string;
  sex: string;
  neutered: boolean;
  ownerName: string;
}

export interface UpdateLaudoRequest {
  generatedContent: ParsedLaudo;
  patientFields: {
    patient_name: string;
    species: string;
    breed: string;
    age: string;
    sex: string;
    neutered: boolean;
    owner_name: string;
    clinic_name: string;
    responsible_vet: string;
    exam_date: string;
  };
}

export interface UpdateProfileRequest {
  full_name: string;
  cpf: string;
  signature_font?: string;
  signature?: string;
  signature_image_url?: string | null;
  crmv?: string;
  crmv_state?: string;
}

// ─── API response types ──────────────────────────────────────────────────────

export interface ApiResponse {
  error?: string;
}

export interface PetResponse extends ApiResponse {
  pet: Pet;
}

export interface PetsResponse extends ApiResponse {
  pets: Pet[];
}

export interface ClinicResponse extends ApiResponse {
  clinic: Clinic;
}

export interface ClinicsResponse extends ApiResponse {
  clinics: Clinic[];
}

export interface VetResponse extends ApiResponse {
  vet: ClinicVet;
}

export interface LaudoResponse extends ApiResponse {
  laudo: Laudo;
}

export interface ImagesResponse extends ApiResponse {
  images: LaudoImage[];
}

export interface TranscribeResponse extends ApiResponse {
  text: string;
}

export type SseEvent =
  | { status: "generating" }
  | { status: "reviewing" }
  | { status: "retrying" }
  | { status: "saving" }
  | { status: "chunk"; text: string }
  | { status: "error"; message: string }
  | { status: "done"; laudo: { id: string } };
