"use client";

import { useState } from "react";

type Plan = "monthly" | "yearly";

const PLANS: { id: Plan; price: string; period: string; tagline?: string }[] = [
  { id: "monthly", price: "R$ 99,90", period: "/mês" },
  { id: "yearly", price: "R$ 990,90", period: "/ano", tagline: "~17% de desconto" },
];

export default function SubscribeGate() {
  const [loadingPlan, setLoadingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  async function handleSubscribe(plan: Plan) {
    setLoadingPlan(plan);
    setError("");
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error ?? "Erro ao iniciar checkout.");
      window.location.href = body.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar checkout.");
      setLoadingPlan(null);
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-xl p-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">Assine para continuar</h2>
      <p className="text-sm text-gray-600 mb-6 text-center">
        Escolha um plano para seguir usando o Laudai. Cancele quando quiser.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {PLANS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => handleSubscribe(p.id)}
            disabled={loadingPlan !== null}
            className="flex flex-col items-center justify-center gap-1 border border-gray-300 rounded-xl py-4 px-3 text-gray-900 hover:border-blue-500 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <span className="text-xs uppercase tracking-wide text-gray-500">
              {p.id === "monthly" ? "Mensal" : "Anual"}
            </span>
            <span className="text-lg font-semibold">{p.price}</span>
            <span className="text-xs text-gray-500">{p.period}</span>
            {p.tagline && <span className="text-xs text-green-700 font-medium">{p.tagline}</span>}
            {loadingPlan === p.id && <span className="text-xs text-blue-600 mt-1">Carregando…</span>}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}
    </div>
  );
}
