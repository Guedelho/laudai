"use client";

import { useState } from "react";
import { Clinic, ClinicVet, ClinicResponse, VetResponse, ApiResponse } from "@/types";
import { getAuthHeaders } from "@/lib/supabase/client";

export default function ClinicsManager({ initialClinics }: { initialClinics: Clinic[] }) {
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [vetName, setVetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [newVetName, setNewVetName] = useState("");
  const [addingVet, setAddingVet] = useState(false);
  const [removingVetId, setRemovingVetId] = useState<string | null>(null);

  function startEdit(clinic: Clinic) {
    setEditingId(clinic.id);
    setEditName(clinic.name);
    setNewVetName("");
    setEditError("");
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditSaving(true);
    setEditError("");

    try {
      const res = await fetch(`/api/clinics/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ name: editName }),
      });
      const data: ClinicResponse = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClinics((prev) =>
        prev
          .map((c) => (c.id === editingId ? { ...c, name: data.clinic.name } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao salvar clínica.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleAddVet(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !newVetName.trim()) return;
    setAddingVet(true);
    setEditError("");

    try {
      const res = await fetch(`/api/clinics/${editingId}/vets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ name: newVetName }),
      });
      const data: VetResponse = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClinics((prev) =>
        prev.map((c) => (c.id === editingId ? { ...c, clinic_vets: [...c.clinic_vets, data.vet] } : c)),
      );
      setNewVetName("");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao adicionar médico.");
    } finally {
      setAddingVet(false);
    }
  }

  async function handleRemoveVet(clinicId: string, vetId: string) {
    setRemovingVetId(vetId);
    setEditError("");

    try {
      const res = await fetch(`/api/clinics/${clinicId}/vets/${vetId}`, {
        method: "DELETE",
        headers: await getAuthHeaders(),
      });
      if (!res.ok) {
        const data: ApiResponse = await res.json();
        throw new Error(data.error);
      }

      setClinics((prev) =>
        prev.map((c) => (c.id === clinicId ? { ...c, clinic_vets: c.clinic_vets.filter((v) => v.id !== vetId) } : c)),
      );
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao remover médico.");
    } finally {
      setRemovingVetId(null);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await getAuthHeaders()) },
        body: JSON.stringify({ name, vetName }),
      });

      const data: ClinicResponse = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClinics((prev) => [...prev, data.clinic].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setVetName("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar clínica.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setDeleteError("");
    try {
      const res = await fetch(`/api/clinics/${id}`, { method: "DELETE", headers: await getAuthHeaders() });
      if (!res.ok) {
        const data: ApiResponse = await res.json();
        throw new Error(data.error);
      }
      setClinics((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Erro ao excluir clínica.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Clínicas</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? "Cancelar" : "Nova clínica"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Cadastrar clínica</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome da clínica</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Médico responsável (opcional)</label>
              <input
                value={vetName}
                onChange={(e) => setVetName(e.target.value)}
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
            {saving ? "Salvando..." : "Salvar clínica"}
          </button>
        </form>
      )}

      {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}

      {!clinics.length && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <p>Nenhuma clínica cadastrada ainda</p>
        </div>
      )}

      <div className="space-y-3">
        {clinics.map((clinic) => (
          <div key={clinic.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {editingId === clinic.id ? (
              <div className="space-y-4">
                <form onSubmit={handleRename} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Nome da clínica</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={editSaving}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shrink-0"
                  >
                    {editSaving ? "Salvando..." : "Salvar nome"}
                  </button>
                </form>

                <div>
                  <p className="text-xs text-gray-500 mb-2">Médicos</p>
                  <div className="space-y-1">
                    {clinic.clinic_vets.map((vet: ClinicVet) => (
                      <div key={vet.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{vet.name}</span>
                        <button
                          onClick={() => handleRemoveVet(clinic.id, vet.id)}
                          disabled={removingVetId === vet.id}
                          className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                        >
                          {removingVetId === vet.id ? "Removendo..." : "Remover"}
                        </button>
                      </div>
                    ))}
                    {clinic.clinic_vets.length === 0 && (
                      <p className="text-xs text-gray-400">Nenhum médico cadastrado</p>
                    )}
                  </div>
                  <form onSubmit={handleAddVet} className="flex gap-2 mt-2">
                    <input
                      value={newVetName}
                      onChange={(e) => setNewVetName(e.target.value)}
                      placeholder="Nome do médico"
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={addingVet || !newVetName.trim()}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 disabled:opacity-50 shrink-0"
                    >
                      {addingVet ? "Adicionando..." : "Adicionar"}
                    </button>
                  </form>
                </div>

                {editError && <p className="text-sm text-red-500">{editError}</p>}

                <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-700">
                  Fechar
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{clinic.name}</p>
                  {clinic.clinic_vets?.length > 0 && (
                    <p className="text-sm text-gray-500 mt-0.5">{clinic.clinic_vets.map((v) => v.name).join(", ")}</p>
                  )}
                </div>
                <div className="flex gap-3 shrink-0 mt-0.5">
                  <button onClick={() => startEdit(clinic)} className="text-xs text-blue-500 hover:text-blue-700">
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(clinic.id)}
                    disabled={deletingId === clinic.id}
                    className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40"
                  >
                    {deletingId === clinic.id ? "Excluindo..." : "Excluir"}
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
