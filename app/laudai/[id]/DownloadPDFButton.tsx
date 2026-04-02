"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DownloadPDFButton({ laudoId }: { laudoId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(`/api/laudos/${laudoId}/pdf`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });

      if (!res.ok) throw new Error("Erro ao gerar PDF");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ?? "laudo.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="print:hidden bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:border-gray-400 disabled:opacity-50"
    >
      {loading ? "Gerando PDF..." : "Baixar PDF"}
    </button>
  );
}
