"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteLaudoButton({ laudoId }: { laudoId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = session?.access_token
        ? { Authorization: `Bearer ${session.access_token}` }
        : {};

      const res = await fetch(`/api/laudos/${laudoId}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error();

      router.push("/dashboard");
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 print:hidden">
        <span className="text-sm text-gray-600">Excluir laudo?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-600 font-medium hover:text-red-800 disabled:opacity-50"
        >
          {deleting ? "Excluindo..." : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-sm text-red-500 hover:text-red-700 print:hidden"
    >
      Excluir
    </button>
  );
}
