export type Specialty = "ultrasound_abdominal";

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
  raw?: string; // fallback for old plain text
}

export interface Profile {
  id: string;
  full_name: string;
  crmv: string;
  cpf: string;
  created_at: string;
  logo_url?: string;
  signature_font?: string;
  crmv_state?: string;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed?: string;
  age?: string;
  sex?: string;
  neutered?: boolean;
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
  breed?: string;
  age?: string;
  sex?: string;
  neutered?: boolean;
  owner_name: string;
  clinic_name?: string;
  responsible_vet?: string;
  raw_input: string;
  generated_content: string;
  created_at: string;
  updated_at?: string;
  pet_id?: string;
}

export interface LaudoImage {
  id: string;
  file_name: string;
  url: string;
}

export interface GenerateRequest {
  specialty: Specialty;
  rawInput: string;
  patientName: string;
  species: string;
  breed?: string;
  age?: string;
  sex?: string;
  neutered?: boolean;
  ownerName: string;
  clinicName?: string;
  responsibleVet?: string;
  petId?: string;
}
