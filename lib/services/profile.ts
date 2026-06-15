import { UpdateProfileRequest } from "@/shared/interfaces";
import { fetchJson, fetchOk, jsonBody, formBody } from "@/lib/fetch";

export async function openBillingPortal(): Promise<string> {
  const { url } = await fetchJson<{ url: string }>("/api/billing/portal", { method: "POST" });
  return url;
}

export async function updateProfile(body: UpdateProfileRequest, signal?: AbortSignal): Promise<void> {
  await fetchOk("/api/profile", { method: "PUT", ...jsonBody(body), signal });
}

export async function uploadOrgLogo(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("logo", file);
  await fetchOk("/api/org/logo", { method: "POST", ...formBody(formData) });
}

export async function removeOrgLogo(): Promise<void> {
  await fetchOk("/api/org/logo", { method: "DELETE" });
}

export async function uploadSignature(file: File): Promise<void> {
  const formData = new FormData();
  formData.append("signature", file);
  await fetchOk("/api/profile/image/signature", { method: "POST", ...formBody(formData) });
}

export async function removeSignature(): Promise<void> {
  await fetchOk("/api/profile/image/signature", { method: "DELETE" });
}

export async function deleteAccount(): Promise<void> {
  await fetchOk("/api/account", { method: "DELETE" });
}

export async function cancelAccountDeletion(): Promise<void> {
  await fetchOk("/api/account", { method: "POST" });
}
