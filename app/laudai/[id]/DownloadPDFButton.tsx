"use client";

import { useState } from "react";

export default function DownloadPDFButton({ laudoId }: { laudoId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePrint() {
    setLoading(true);
    setError("");
    window.location.href = `/api/laudos/${laudoId}/pdf`;
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
