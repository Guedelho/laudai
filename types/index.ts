export type Specialty = "ultrasound_abdominal" | "ultrasound_thoracic" | "dental" | "xray";

export interface Profile {
  id: string;
  full_name: string;
  crmv: string;
  cpf: string;
  created_at: string;
}

export interface Pet {
  id: string;
  user_id: string;
  name: string;
  species: string;
  breed?: string;
  age?: string;
  owner_name: string;
  created_at: string;
}

export interface Laudo {
  id: string;
  user_id: string;
  specialty: Specialty;
  patient_name: string;
  species: string;
  breed?: string;
  age?: string;
  owner_name: string;
  raw_input: string;
  generated_content: string;
  created_at: string;
  updated_at?: string;
  pet_id?: string;
}

export interface GenerateRequest {
  specialty: Specialty;
  rawInput: string;
  patientName: string;
  species: string;
  breed?: string;
  age?: string;
  ownerName: string;
  petId?: string;
}
