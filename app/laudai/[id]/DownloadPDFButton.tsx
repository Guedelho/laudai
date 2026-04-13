"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DownloadPDFButton({ laudoId }: { laudoId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePrint() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`/api/laudos/${laudoId}/pdf`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (!res.ok) throw new Error("Erro ao gerar PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="print:hidden">
      <button
        onClick={handlePrint}
        disabled={loading}
        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-400 disabled:opacity-50"
      >
        {loading ? "Gerando PDF..." : "Imprimir"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
