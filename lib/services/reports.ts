import { ReportImage, ReportSummary } from "@/shared/models";
import {
  GenerateRequest,
  GenerateResponse,
  ListReportsResponse,
  UpdateReportRequest,
  ImagesResponse,
} from "@/shared/interfaces";
import { fetchJson, fetchOk, jsonBody, formBody } from "@/lib/fetch";

export async function listReports(limit: number, before?: string): Promise<ReportSummary[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set("before", before);
  const data = await fetchJson<ListReportsResponse>(`/api/reports?${params.toString()}`);
  return data.reports ?? [];
}

export async function enqueueGeneration(body: GenerateRequest): Promise<string> {
  const data = await fetchJson<GenerateResponse>("/api/generate", { method: "POST", ...jsonBody(body) });
  if (!data.reportId) throw new Error("Resposta inválida do servidor.");
  return data.reportId;
}

export async function regenerateReport(id: string): Promise<void> {
  await fetchOk(`/api/reports/${id}/regenerate`, { method: "POST" });
}

export async function updateReport(id: string, body: UpdateReportRequest): Promise<void> {
  await fetchOk(`/api/reports/${id}`, { method: "PATCH", ...jsonBody(body) });
}

export async function deleteReport(id: string): Promise<void> {
  await fetchOk(`/api/reports/${id}`, { method: "DELETE" });
}

export async function uploadReportImages(reportId: string, files: File[]): Promise<ReportImage[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));
  const data = await fetchJson<ImagesResponse>(`/api/reports/${reportId}/images`, {
    method: "POST",
    ...formBody(formData),
  });
  return data.images ?? [];
}

export async function deleteReportImage(reportId: string, imageId: string): Promise<void> {
  await fetchOk(`/api/reports/${reportId}/images/${imageId}`, { method: "DELETE" });
}
