"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfileForm({
  initialFullName,
  initialCrmv,
  initialCpf,
}: {
  initialFullName: string;
  initialCrmv: string;
  initialCpf: string;
}) {
  const [fullName, setFullName] = useState(initialFullName);
  const [crmv, setCrmv] = useState(initialCrmv);
  const [cpf, setCpf] = useState(initialCpf);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ full_name: fullName, crmv, cpf }),
      });

      if (!res.ok) throw new Error("Erro ao salvar");
      setSaved(true);
      router.refresh();
    } catch {
      alert("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Dra. Tatiana Brasil"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CRMV</label>
        <input
          type="text"
          value={crmv}
          onChange={(e) => setCrmv(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="4125"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
        <input
          type="text"
          value={cpf}
          onChange={(e) => setCpf(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="000.000.000-00"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {saved && <span className="text-sm text-green-600">Salvo com sucesso!</span>}
      </div>
    </form>
  );
}
