"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DownloadPDFButton({ laudoId }: { laudoId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`/api/laudos/${laudoId}/pdf`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (!res.ok) throw new Error("Erro ao gerar PDF");

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? "laudo.pdf";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="print:hidden">
      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-400 disabled:opacity-50"
      >
        {loading ? "Gerando PDF..." : "Baixar PDF"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
