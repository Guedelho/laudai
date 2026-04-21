import { UpdateProfileRequest } from "@/shared/interfaces";
import { fetchOk, jsonBody, formBody } from "./fetch";

export async function updateProfile(body: UpdateProfileRequest, signal?: AbortSignal): Promise<void> {
  await fetchOk("/api/profile", { method: "PUT", ...jsonBody(body), signal });
}

export async function uploadLogo(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("logo", file);
  await fetchOk("/api/profile/logo", { method: "POST", ...formBody(formData) });
}

export async function uploadSignature(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("signature", file);
  await fetchOk("/api/profile/signature", { method: "POST", ...formBody(formData) });
}

export async function removeSignature(): Promise<void> {
  await fetchOk("/api/profile/signature", { method: "DELETE" });
}
