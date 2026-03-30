"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditRawInput({
  laudoId,
  initialRawInput,
}: {
  laudoId: string;
  initialRawInput: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [rawInput, setRawInput] = useState(initialRawInput);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleRegenerate() {
    setRegenerating(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`/api/laudos/${laudoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ rawInput }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao regenerar laudo.");
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">Achados informados</p>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Editar
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={5}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={handleRegenerate}
              disabled={regenerating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {regenerating ? "Regenerando..." : "Regenerar laudo"}
            </button>
            <button
              onClick={() => {
                setRawInput(initialRawInput);
                setEditing(false);
                setError("");
              }}
              disabled={regenerating}
              className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-300"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600 whitespace-pre-wrap">
          {rawInput.trim() || <span className="italic text-gray-400">Nenhuma alteração informada</span>}
        </p>
      )}
    </div>
  );
}
