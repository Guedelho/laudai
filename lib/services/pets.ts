import { Pet } from "@/shared/models";
import { PetResponse, PetsResponse, PetRequest } from "@/shared/interfaces";
import { fetchJson, fetchOk, jsonBody } from "@/lib/fetch";

export async function listPets(): Promise<Pet[]> {
  const data = await fetchJson<PetsResponse>("/api/pets");
  return data.pets ?? [];
}

export async function createPet(body: PetRequest): Promise<Pet> {
  const data = await fetchJson<PetResponse>("/api/pets", { method: "POST", ...jsonBody(body) });
  return data.pet;
}

export async function updatePet(id: string, body: PetRequest): Promise<Pet> {
  const data = await fetchJson<PetResponse>(`/api/pets/${id}`, { method: "PATCH", ...jsonBody(body) });
  return data.pet;
}

export async function deletePet(id: string): Promise<void> {
  await fetchOk(`/api/pets/${id}`, { method: "DELETE" });
}
