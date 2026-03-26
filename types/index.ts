export type Specialty = "ultrasound_abdominal" | "ultrasound_thoracic" | "dental" | "xray";

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
}

export interface GenerateRequest {
  specialty: Specialty;
  rawInput: string;
  patientName: string;
  species: string;
  breed?: string;
  age?: string;
  ownerName: string;
  veterinarian: string;
  crmv: string;
}
