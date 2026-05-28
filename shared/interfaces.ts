import type {
  ParsedReport,
  PatientFields,
  ReportFields,
  Pet,
  Client,
  ClientVet,
  ReportImage,
  ReportSummary,
} from "./models";
import type { ReportType } from "@/shared/constants";
// ─── Request types ───────────────────────────────────────────────────────────

export interface GenerateRequest extends ReportFields {
  specialty: ReportType;
  rawInput: string;
  petId?: string;
  clientId?: string;
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

export interface ClientRequest {
  name: string;
  vetName?: string;
}

export interface ClientVetRequest {
  name: string;
}

export interface UpdateReportRequest {
  generatedContent: ParsedReport;
  petId?: string;
  clientId?: string;
  vetId?: string;
  patientFields: {
    patient_name: string;
    species: string;
    breed: string;
    age: string;
    sex: string;
    neutered: boolean;
    owner_name: string;
    client_name: string;
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

export interface ClientResponse extends ApiResponse {
  client: Client;
}

export interface ClientsResponse extends ApiResponse {
  clients: Client[];
}

export interface VetResponse extends ApiResponse {
  vet: ClientVet;
}

export interface ImagesResponse extends ApiResponse {
  images: ReportImage[];
}

export interface ListReportsResponse extends ApiResponse {
  reports?: ReportSummary[];
}

// ─── Generation ──────────────────────────────────────────────────────────────

export interface GenerateResponse extends ApiResponse {
  reportId?: string;
}

export interface GenerateParams extends PatientFields {
  rawInput: string;
}

// ─── PDF ─────────────────────────────────────────────────────────────────────

export interface PdfData extends PatientFields {
  clientName: string;
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
