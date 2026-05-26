import { Client, ClientVet } from "@/shared/models";
import { ClientResponse, ClientsResponse, VetResponse } from "@/shared/interfaces";
import { fetchJson, fetchOk, jsonBody } from "@/lib/fetch";

export async function listClients(): Promise<Client[]> {
  const data = await fetchJson<ClientsResponse>("/api/clients");
  return data.clients ?? [];
}

export async function createClient(name: string, vetName: string): Promise<{ client: Client; vet: ClientVet | null }> {
  const data = await fetchJson<ClientResponse>("/api/clients", { method: "POST", ...jsonBody({ name, vetName }) });
  const vet = data.client.client_vets?.find((v) => v.name === vetName.trim()) ?? null;
  return { client: data.client, vet };
}

export async function renameClient(id: string, name: string): Promise<Client> {
  const data = await fetchJson<ClientResponse>(`/api/clients/${id}`, { method: "PATCH", ...jsonBody({ name }) });
  return data.client;
}

export async function deleteClient(id: string): Promise<void> {
  await fetchOk(`/api/clients/${id}`, { method: "DELETE" });
}

export async function addVet(clientId: string, name: string): Promise<ClientVet> {
  const data = await fetchJson<VetResponse>(`/api/clients/${clientId}/vets`, {
    method: "POST",
    ...jsonBody({ name }),
  });
  return data.vet;
}

export async function removeVet(clientId: string, vetId: string): Promise<void> {
  await fetchOk(`/api/clients/${clientId}/vets/${vetId}`, { method: "DELETE" });
}
