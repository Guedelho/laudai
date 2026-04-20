import type {
  ParsedReport,
  PatientFields,
  ReportFields,
  Pet,
  Clinic,
  ClinicVet,
  Report,
  ReportImage,
  Specialty,
} from "./models";
// ─── Request types ───────────────────────────────────────────────────────────

export interface GenerateRequest extends ReportFields {
  specialty: Specialty;
  rawInput: string;
  petId?: string;
  clinicId?: string;
  vetId?: string;
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

export interface UpdateReportRequest {
  generatedContent: ParsedReport;
  petId?: string;
  clinicId?: string;
  vetId?: string;
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

// ─── Response types ──────────────────────────────────────────────────────────

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

export interface ImagesResponse extends ApiResponse {
  images: ReportImage[];
}

export interface TranscribeResponse extends ApiResponse {
  text: string;
}

// ─── SSE events ──────────────────────────────────────────────────────────────

export type SseEvent =
  | { status: "generating" }
  | { status: "retrying" }
  | { status: "saving" }
  | { status: "chunk"; text: string }
  | { status: "error"; message: string }
  | { status: "done"; report: { id: string } };

// ─── Generation ──────────────────────────────────────────────────────────────

export interface GenerateParams extends PatientFields {
  rawInput: string;
  onStatus?: (status: "generating" | "retrying") => void;
  onChunk?: (text: string) => void;
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export interface PdfData extends PatientFields {
  clinicName: string;
  responsibleVet: string;
  date: string;
  reportTitle: string;
  vetName: string;
  signatureText: string;
  crmv: string;
  crmvState?: string;
  parsedReport: ParsedReport;
  imageBase64List: string[];
  logoBase64?: string;
  signatureFont?: string;
  signatureImageBase64?: string;
}
