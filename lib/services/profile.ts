import { UpdateProfileRequest } from "@/shared/interfaces";
import { fetchOk, jsonBody, formBody } from "@/lib/fetch";

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

export async function deleteAccount(): Promise<void> {
  await fetchOk("/api/account", { method: "DELETE" });
}

export async function downloadAccountExport(): Promise<void> {
  const res = await fetch("/api/account/export");
  if (!res.ok) throw new Error("Falha ao exportar dados.");
  const filename = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "laudai-export.json";
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
