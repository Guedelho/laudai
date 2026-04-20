import { LaudoImage } from "@/shared/models";
import { UpdateLaudoRequest, ImagesResponse } from "@/shared/interfaces";
import { fetchJson, fetchOk, jsonBody, formBody } from "./fetch";

export async function updateLaudo(id: string, body: UpdateLaudoRequest): Promise<void> {
  await fetchOk(`/api/laudos/${id}`, { method: "PATCH", ...jsonBody(body) });
}

export async function deleteLaudo(id: string): Promise<void> {
  await fetchOk(`/api/laudos/${id}`, { method: "DELETE" });
}

export async function lockLaudo(id: string): Promise<void> {
  await fetch(`/api/laudos/${id}/lock`, { method: "POST" });
}

export async function uploadImages(laudoId: string, files: File[]): Promise<LaudoImage[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));
  const data = await fetchJson<ImagesResponse>(`/api/laudos/${laudoId}/images`, {
    method: "POST",
    ...formBody(formData),
  });
  return data.images ?? [];
}

export async function deleteImage(laudoId: string, imageId: string): Promise<void> {
  await fetchOk(`/api/laudos/${laudoId}/images/${imageId}`, { method: "DELETE" });
}
