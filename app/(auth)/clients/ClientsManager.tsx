"use client";

import { useState } from "react";
import { Client, ClientVet } from "@/shared/models";
import * as api from "@/lib/services/clients";
import { inputCls } from "@/lib/ui";
import ConfirmDelete from "@/components/ConfirmDelete";

export default function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [vetName, setVetName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [newVetName, setNewVetName] = useState("");
  const [addingVet, setAddingVet] = useState(false);

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditName(client.name);
    setNewVetName("");
    setEditError("");
  }

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setEditSaving(true);
    setEditError("");

    try {
      const client = await api.renameClient(editingId, editName);
      setClients((prev) =>
        prev
          .map((c) => (c.id === editingId ? { ...c, name: client.name } : c))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao salvar cliente.");
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
      const vet = await api.addVet(editingId, newVetName);
      setClients((prev) => prev.map((c) => (c.id === editingId ? { ...c, client_vets: [...c.client_vets, vet] } : c)));
      setNewVetName("");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Erro ao adicionar médico.");
    } finally {
      setAddingVet(false);
    }
  }

  async function handleRemoveVet(clientId: string, vetId: string) {
    await api.removeVet(clientId, vetId);
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, client_vets: c.client_vets.filter((v) => v.id !== vetId) } : c)),
    );
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const { client } = await api.createClient(name, vetName);
      setClients((prev) => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setVetName("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await api.deleteClient(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          {showForm ? "Cancelar" : "Novo cliente"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold text-gray-700">Cadastrar cliente</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nome do cliente</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Médico responsável (opcional)</label>
              <input value={vetName} onChange={(e) => setVetName(e.target.value)} className={inputCls} />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar cliente"}
          </button>
        </form>
      )}

      {!clients.length && !showForm && (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-3">Nenhum cliente cadastrado ainda</p>
          <button type="button" onClick={() => setShowForm(true)} className="text-sm text-blue-600 hover:underline">
            Cadastrar primeiro cliente
          </button>
        </div>
      )}

      <div className="space-y-3">
        {clients.map((client) => (
          <div key={client.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {editingId === client.id ? (
              <div className="space-y-4">
                <form onSubmit={handleRename} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">Nome do cliente</label>
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={inputCls}
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
                    {client.client_vets.map((vet: ClientVet) => (
                      <div key={vet.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{vet.name}</span>
                        <ConfirmDelete
                          noun="Médico"
                          label="Remover"
                          onConfirm={() => handleRemoveVet(client.id, vet.id)}
                        />
                      </div>
                    ))}
                    {client.client_vets.length === 0 && (
                      <p className="text-xs text-gray-500">Nenhum médico cadastrado</p>
                    )}
                  </div>
                  <form onSubmit={handleAddVet} className="flex gap-2 mt-2">
                    <input
                      value={newVetName}
                      onChange={(e) => setNewVetName(e.target.value)}
                      placeholder="Nome do médico"
                      className={`flex-1 ${inputCls}`}
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

                {editError && <p className="text-sm text-red-600">{editError}</p>}

                <button onClick={() => setEditingId(null)} className="text-sm text-gray-500 hover:text-gray-700">
                  Fechar
                </button>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900">{client.name}</p>
                  {client.client_vets?.length > 0 && (
                    <p className="text-sm text-gray-500 mt-0.5">{client.client_vets.map((v) => v.name).join(", ")}</p>
                  )}
                </div>
                <div className="flex gap-3 shrink-0 mt-0.5">
                  <button onClick={() => startEdit(client)} className="text-xs text-blue-600 hover:text-blue-700">
                    Editar
                  </button>
                  <ConfirmDelete noun="Cliente" onConfirm={() => handleDelete(client.id)} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
