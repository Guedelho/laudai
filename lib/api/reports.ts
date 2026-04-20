import { ReportImage } from "@/shared/models";
import { UpdateReportRequest, ImagesResponse } from "@/shared/interfaces";
import { fetchJson, fetchOk, jsonBody, formBody } from "./fetch";

export async function updateReport(id: string, body: UpdateReportRequest): Promise<void> {
  await fetchOk(`/api/reports/${id}`, { method: "PATCH", ...jsonBody(body) });
}

export async function deleteReport(id: string): Promise<void> {
  await fetchOk(`/api/reports/${id}`, { method: "DELETE" });
}

export async function lockReport(id: string): Promise<void> {
  await fetch(`/api/reports/${id}/lock`, { method: "POST" });
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
