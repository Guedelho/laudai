"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PrintButton({ laudoId }: { laudoId: string }) {
  const [loading, setLoading] = useState(false);

  async function handlePrint() {
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
      const win = window.open(url);
      if (win) {
        win.onload = () => {
          win.print();
          URL.revokeObjectURL(url);
        };
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao gerar PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Gerando PDF..." : "Imprimir / PDF"}
    </button>
  );
}
