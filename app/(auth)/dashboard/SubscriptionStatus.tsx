"use client";

import { useState } from "react";

interface Props {
  status: "trialing" | "active" | "past_due";
  periodEnd: string | null;
}

export default function SubscriptionStatus({ status, periodEnd }: Props) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error ?? "Erro ao abrir o portal.");
      window.location.href = body.url;
    } catch {
      setLoading(false);
    }
  }

  const label = labelFor(status, periodEnd);

  return (
    <div className="flex items-center justify-between gap-3 mb-4 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm">
      <span className="text-gray-700">{label}</span>
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        className="text-blue-600 hover:underline disabled:opacity-50"
      >
        {loading ? "Abrindo..." : "Gerenciar assinatura"}
      </button>
    </div>
  );
}

function labelFor(status: Props["status"], periodEnd: string | null): string {
  if (status === "past_due") return "Pagamento pendente. Atualize seu cartão para continuar.";

  if (!periodEnd) return status === "trialing" ? "Período de teste ativo." : "Plano Mensal ativo.";

  const end = new Date(periodEnd);
  const daysLeft = Math.ceil((end.getTime() - Date.now()) / 86_400_000);

  if (status === "trialing") {
    if (daysLeft <= 0) return "Período de teste termina hoje.";
    if (daysLeft === 1) return "Período de teste: 1 dia restante.";
    return `Período de teste: ${daysLeft} dias restantes.`;
  }

  return `Plano Mensal — próxima cobrança em ${end.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}.`;
}
