"use client";

import { useState } from "react";

export default function SubscribeGate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubscribe() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error ?? "Erro ao iniciar checkout.");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl p-8 text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Assine para começar</h2>
      <p className="text-sm text-gray-600 mb-6">7 dias grátis, depois R$ 99,90/mês. Cancele quando quiser.</p>
      <button
        type="button"
        onClick={handleSubscribe}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Carregando..." : "Iniciar período grátis"}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
