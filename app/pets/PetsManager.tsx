"use client";

import { useState } from "react";
import { Pet } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function PetsManager({ initialPets }: { initialPets: Pet[] }) {
  const [pets, setPets] = useState<Pet[]>(initialPets);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("Canino");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/pets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ name, species, breed, age, ownerName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPets((prev) => [...prev, data.pet].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setSpecies("Canino");
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
              <label className="block text-xs text-gray-500 mb-1">Tutor</label>
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
                <option>Canino</option>
                <option>Felino</option>
                <option>Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Raça</label>
              <input
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
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

      {!pets.length && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <p>Nenhum paciente cadastrado ainda</p>
        </div>
      )}

      <div className="space-y-3">
        {pets.map((pet) => (
          <div key={pet.id} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="font-medium text-gray-900">{pet.name}</p>
            <p className="text-sm text-gray-500">
              {pet.species}{pet.breed ? ` · ${pet.breed}` : ""}{pet.age ? ` · ${pet.age}` : ""}
            </p>
            <p className="text-xs text-gray-400 mt-1">Tutor: {pet.owner_name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
