"use client";

import { useState } from "react";
import { Pet } from "@/shared/models";
import { sexLabel } from "@/lib/utils";
import * as api from "@/lib/services/pets";
import ConfirmDelete from "@/components/ConfirmDelete";
import PetFormFields, { PetFormValues } from "./PetFormFields";

const EMPTY_FORM: PetFormValues = {
  name: "",
  owner_name: "",
  species: "Canina",
  breed: "",
  age: "",
  sex: "",
  neutered: false,
};

function petToForm(pet: Pet): PetFormValues {
  return {
    name: pet.name,
    owner_name: pet.owner_name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    sex: pet.sex ?? "",
    neutered: pet.neutered ?? false,
  };
}

export default function PetsManager({ initialPets }: { initialPets: Pet[] }) {
  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [showForm, setShowForm] = useState(false);
  const [newForm, setNewForm] = useState<PetFormValues>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PetFormValues>(EMPTY_FORM);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const breedSuggestions = [...new Set(pets.map((p) => p.breed).filter(Boolean) as string[])].sort();

  function updateNew<K extends keyof PetFormValues>(field: K, value: PetFormValues[K]) {
    setNewForm((f) => ({ ...f, [field]: value }));
  }

  function updateEdit<K extends keyof PetFormValues>(field: K, value: PetFormValues[K]) {
    setEditForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(pet: Pet) {
    setEditingId(pet.id);
    setEditForm(petToForm(pet));
    setEditError("");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditSaving(true);
    setEditError("");

    try {
      const pet = await api.updatePet(editingId, {
        name: editForm.name,
        species: editForm.species,
        breed: editForm.breed,
        age: editForm.age,
        ownerName: editForm.owner_name,
        sex: editForm.sex,
        neutered: editForm.neutered,
      });

      setPets((prev) => prev.map((p) => (p.id === editingId ? pet : p)).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao salvar paciente.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.deletePet(id);
    setPets((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const pet = await api.createPet({
        name: newForm.name,
        species: newForm.species,
        breed: newForm.breed,
        age: newForm.age,
        ownerName: newForm.owner_name,
        sex: newForm.sex,
        neutered: newForm.neutered,
      });

      setPets((prev) => [...prev, pet].sort((a, b) => a.name.localeCompare(b.name)));
      setNewForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar paciente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Pacientes</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? "Cancelar" : "Novo paciente"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Cadastrar paciente</p>
          <PetFormFields values={newForm} onChange={updateNew} breedSuggestions={breedSuggestions} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar paciente"}
          </button>
        </form>
      )}

      {!pets.length && !showForm && (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-3">Nenhum paciente cadastrado ainda</p>
          <button type="button" onClick={() => setShowForm(true)} className="text-sm text-blue-600 hover:underline">
            Cadastrar primeiro paciente
          </button>
        </div>
      )}

      <div className="space-y-3">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {editingId === pet.id ? (
              <form onSubmit={handleEdit} className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Editar paciente</p>
                <PetFormFields values={editForm} onChange={updateEdit} breedSuggestions={breedSuggestions} />
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editSaving ? "Salvando..." : "Salvar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
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
                  <button onClick={() => startEdit(pet)} className="text-xs text-blue-600 hover:text-blue-700">
                    Editar
                  </button>
                  <ConfirmDelete noun="Paciente" onConfirm={() => handleDelete(pet.id)} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
