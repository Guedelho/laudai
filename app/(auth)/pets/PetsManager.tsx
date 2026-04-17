"use client";

import { useState } from "react";
import { Pet, SPECIES_OPTIONS, SEX_OPTIONS, sexLabel } from "@/types";
import { getAuthHeaders } from "@/lib/supabase/client";
import Typeahead from "@/components/Typeahead";

export default function PetsManager({ initialPets }: { initialPets: Pet[] }) {
  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Canina");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<Pet>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");


  const breedSuggestions = [...new Set(pets.map((p) => p.breed).filter(Boolean) as string[])].sort();

  function startEdit(pet: Pet) {
    setEditingId(pet.id);
    setEditFields({
      name: pet.name,
      species: pet.species,
      breed: pet.breed ?? "",
      age: pet.age ?? "",
      owner_name: pet.owner_name,
      sex: pet.sex,
      neutered: pet.neutered,
    });
    setEditError("");
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditSaving(true);
    setEditError("");

    try {
      const res = await fetch(`/api/pets/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({
          name: editFields.name,
          species: editFields.species,
          breed: editFields.breed,
          age: editFields.age,
          ownerName: editFields.owner_name,
          sex: editFields.sex,
          neutered: editFields.neutered,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPets((prev) =>
        prev.map((p) => (p.id === editingId ? data.pet : p)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao salvar paciente.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError("");
    try {
      const res = await fetch(`/api/pets/${id}`, { method: "DELETE", headers: await getAuthHeaders() });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      setPets((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro ao excluir paciente.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ name, species, breed, age, ownerName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPets((prev) => [...prev, data.pet].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setSpecies("Canina");
      setBreed("");
      setAge("");
      setOwnerName("");
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
        <h2 className="text-xl font-semibold text-gray-900">Pacientes</h2>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome do animal</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Responsável</label>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Espécie</label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SPECIES_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Raça</label>
              <Typeahead
                value={breed}
                onChange={setBreed}
                suggestions={breedSuggestions}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Idade</label>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="ex: 3 anos"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar paciente"}
          </button>
        </form>
      )}

      {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}

      {!pets.length && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <p>Nenhum paciente cadastrado ainda</p>
        </div>
      )}

      <div className="space-y-3">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {editingId === pet.id ? (
              <form onSubmit={handleEdit} className="space-y-3">
                <p className="text-sm font-semibold text-gray-700">Editar paciente</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nome do animal</label>
                    <input
                      value={editFields.name ?? ""}
                      onChange={(e) => setEditFields((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Responsável</label>
                    <input
                      value={editFields.owner_name ?? ""}
                      onChange={(e) => setEditFields((f) => ({ ...f, owner_name: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Espécie</label>
                    <select
                      value={editFields.species ?? "Canina"}
                      onChange={(e) => setEditFields((f) => ({ ...f, species: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SPECIES_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Raça</label>
                    <Typeahead
                      value={editFields.breed ?? ""}
                      onChange={(v) => setEditFields((f) => ({ ...f, breed: v }))}
                      suggestions={breedSuggestions}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Idade</label>
                    <input
                      value={editFields.age ?? ""}
                      onChange={(e) => setEditFields((f) => ({ ...f, age: e.target.value }))}
                      placeholder="ex: 3 anos"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Sexo</label>
                    <select
                      value={editFields.sex}
                      onChange={(e) => setEditFields((f) => ({ ...f, sex: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {SEX_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editFields.neutered}
                    onChange={(e) => setEditFields((f) => ({ ...f, neutered: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  Castrado(a)
                </label>
                {editError && <p className="text-sm text-red-500">{editError}</p>}
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
                    {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}{pet.age ? ` · ${pet.age}` : ""}
                     · {sexLabel(pet.sex)}{pet.neutered ? " · Castrado(a)" : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Responsável: {pet.owner_name}</p>
                </div>
                <div className="flex gap-3 shrink-0 mt-0.5">
                  <button
                    onClick={() => startEdit(pet)}
                    className="text-xs text-blue-500 hover:text-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(pet.id)}
                    disabled={deletingId === pet.id}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                  >
                    {deletingId === pet.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
