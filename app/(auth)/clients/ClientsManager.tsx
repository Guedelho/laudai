"use client";

import { useState } from "react";
import { Client, ClientVet } from "@/shared/models";
import * as api from "@/lib/services/clients";
import { inputCls, btnPrimary, btnSecondary } from "@/lib/ui";
import ConfirmDelete from "@/components/ConfirmDelete";
import { useEntityCrud } from "@/lib/hooks/use-entity-crud";

export default function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const crud = useEntityCrud<Client>(initialClients, "Erro ao salvar cliente.");
  const [name, setName] = useState("");
  const [vetName, setVetName] = useState("");
  const [editName, setEditName] = useState("");
  const [newVetName, setNewVetName] = useState("");
  const [addingVet, setAddingVet] = useState(false);

  function startEdit(client: Client) {
    crud.startEdit(client.id);
    setEditName(client.name);
    setNewVetName("");
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    crud.submitAdd(
      async () => (await api.createClient(name, vetName)).client,
      () => {
        setName("");
        setVetName("");
      },
    );
  }

  function handleRename(e: React.FormEvent) {
    e.preventDefault();
    crud.submitEdit(
      async () => {
        const client = await api.renameClient(crud.editingId!, editName);
        return (c) => ({ ...c, name: client.name });
      },
      { close: false },
    );
  }

  async function handleAddVet(e: React.FormEvent) {
    e.preventDefault();
    if (!newVetName.trim()) return;
    setAddingVet(true);
    await crud.submitEdit(
      async () => {
        const vet = await api.addVet(crud.editingId!, newVetName);
        setNewVetName("");
        return (c) => ({ ...c, client_vets: [...c.client_vets, vet] });
      },
      { close: false },
    );
    setAddingVet(false);
  }

  async function handleRemoveVet(clientId: string, vetId: string) {
    await api.removeVet(clientId, vetId);
    crud.setItems((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, client_vets: c.client_vets.filter((v) => v.id !== vetId) } : c)),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Clientes</h1>
        <button type="button" onClick={() => crud.setShowForm((v) => !v)} className={btnPrimary}>
          {crud.showForm ? "Cancelar" : "Novo cliente"}
        </button>
      </div>

      {crud.showForm && (
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
          {crud.error && <p className="text-sm text-red-600">{crud.error}</p>}
          <button type="submit" disabled={crud.saving} className={btnPrimary}>
            {crud.saving ? "Salvando..." : "Salvar cliente"}
          </button>
        </form>
      )}

      {!crud.items.length && !crud.showForm && (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-3">Nenhum cliente cadastrado ainda</p>
          <button
            type="button"
            onClick={() => crud.setShowForm(true)}
            className="text-sm text-blue-600 hover:underline"
          >
            Cadastrar primeiro cliente
          </button>
        </div>
      )}

      <div className="space-y-3">
        {crud.items.map((client) => (
          <div key={client.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {crud.editingId === client.id ? (
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
                  <button type="submit" disabled={crud.editSaving} className={`${btnPrimary} shrink-0`}>
                    {crud.editSaving && !addingVet ? "Salvando..." : "Salvar nome"}
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
                      disabled={crud.editSaving || !newVetName.trim()}
                      className={`${btnSecondary} shrink-0`}
                    >
                      {addingVet ? "Adicionando..." : "Adicionar"}
                    </button>
                  </form>
                </div>

                {crud.editError && <p className="text-sm text-red-600">{crud.editError}</p>}

                <button
                  type="button"
                  onClick={() => crud.setEditingId(null)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
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
                  <button
                    type="button"
                    onClick={() => startEdit(client)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    Editar
                  </button>
                  <ConfirmDelete
                    noun="Cliente"
                    onConfirm={() => crud.remove(client.id, () => api.deleteClient(client.id))}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
