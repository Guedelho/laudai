"use client";

import { useState } from "react";
import { Pet } from "@/shared/models";
import { sexLabel, uniqueBreeds } from "@/lib/utils";
import * as api from "@/lib/services/pets";
import { btnPrimary } from "@/lib/ui";
import ConfirmDelete from "@/components/ConfirmDelete";
import { useEntityCrud } from "@/lib/hooks/use-entity-crud";
import PetFormFields, { PetFormValues } from "./PetFormFields";

const EMPTY_FORM: PetFormValues = {
  name: "",
  owner_name: "",
  species: "Canina",
  breed: "",
  age: "",
  sex: "M",
  neutered: false,
};

function petToForm(pet: Pet): PetFormValues {
  return {
    name: pet.name,
    owner_name: pet.owner_name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    sex: pet.sex,
    neutered: pet.neutered,
  };
}

function formToRequest(form: PetFormValues) {
  return {
    name: form.name,
    species: form.species,
    breed: form.breed,
    age: form.age,
    ownerName: form.owner_name,
    sex: form.sex,
    neutered: form.neutered,
  };
}

export default function PetsManager({ initialPets }: { initialPets: Pet[] }) {
  const crud = useEntityCrud<Pet>(initialPets, "Erro ao salvar paciente.");
  const [newForm, setNewForm] = useState<PetFormValues>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<PetFormValues>(EMPTY_FORM);

  const breedSuggestions = uniqueBreeds(crud.items);

  function updateNew<K extends keyof PetFormValues>(field: K, value: PetFormValues[K]) {
    setNewForm((f) => ({ ...f, [field]: value }));
  }

  function updateEdit<K extends keyof PetFormValues>(field: K, value: PetFormValues[K]) {
    setEditForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(pet: Pet) {
    crud.startEdit(pet.id);
    setEditForm(petToForm(pet));
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    crud.submitAdd(
      () => api.createPet(formToRequest(newForm)),
      () => setNewForm(EMPTY_FORM),
    );
  }

  function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    crud.submitEdit(async () => {
      const pet = await api.updatePet(crud.editingId!, formToRequest(editForm));
      return () => pet;
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Pacientes</h1>
        <button type="button" onClick={() => crud.setShowForm((v) => !v)} className={btnPrimary}>
          {crud.showForm ? "Cancelar" : "Novo paciente"}
        </button>
      </div>

      {crud.showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Cadastrar paciente</p>
          <PetFormFields values={newForm} onChange={updateNew} breedSuggestions={breedSuggestions} />
          {crud.error && <p className="text-sm text-red-600">{crud.error}</p>}
          <button type="submit" disabled={crud.saving} className={btnPrimary}>
            {crud.saving ? "Salvando..." : "Salvar paciente"}
          </button>
        </form>
      )}

      {!crud.items.length && !crud.showForm && (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-3">Nenhum paciente cadastrado ainda</p>
          <button
            type="button"
            onClick={() => crud.setShowForm(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            Cadastrar primeiro paciente
          </button>
        </div>
      )}

      <div className="space-y-3">
        {crud.items.map((pet) => (
          <div key={pet.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {crud.editingId === pet.id ? (
              <form onSubmit={handleEdit} className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Editar paciente</p>
                <PetFormFields values={editForm} onChange={updateEdit} breedSuggestions={breedSuggestions} />
                {crud.editError && <p className="text-sm text-red-600">{crud.editError}</p>}
                <div className="flex gap-2">
                  <button type="submit" disabled={crud.editSaving} className={btnPrimary}>
                    {crud.editSaving ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => crud.setEditingId(null)}
                    className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{pet.name}</p>
                  <p className="text-sm text-gray-500">
                    {pet.species} · {pet.breed} · {pet.age} · {sexLabel(pet.sex)}
                    {pet.neutered ? " · Castrado(a)" : ""}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Responsável: {pet.owner_name}</p>
                </div>
                <div className="flex gap-3 shrink-0 mt-0.5">
                  <button
                    type="button"
                    onClick={() => startEdit(pet)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Editar
                  </button>
                  <ConfirmDelete noun="Paciente" onConfirm={() => crud.remove(pet.id, () => api.deletePet(pet.id))} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
