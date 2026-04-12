"use client";

import { useState } from "react";
import { Clinic } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function ClinicsManager({ initialClinics }: { initialClinics: Clinic[] }) {
  const [clinics, setClinics] = useState<Clinic[]>(initialClinics);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [vetName, setVetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token
      ? { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }
      : { "Content-Type": "application/json" };
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const headers = await getAuthHeaders();
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, vetName }),
      });

      const data = await res.json();
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
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const res = await fetch(`/api/clinics/${id}`, { method: "DELETE", headers });
      if (!res.ok) {
        const data = await res.json();
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
          <div key={clinic.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-gray-900">{clinic.name}</p>
              {clinic.clinic_vets?.length > 0 && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {clinic.clinic_vets.map((v) => v.name).join(", ")}
                </p>
              )}
            </div>
            <button
              onClick={() => handleDelete(clinic.id)}
              disabled={deletingId === clinic.id}
              className="text-xs text-red-500 hover:text-red-700 disabled:opacity-40 shrink-0 mt-0.5"
            >
              {deletingId === clinic.id ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
