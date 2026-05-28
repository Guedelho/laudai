"use client";

import { useState } from "react";

interface Props {
  status: "trialing" | "active" | "past_due";
  periodEnd: string | null;
  canManage: boolean;
}

export default function SubscriptionChip({ status, periodEnd, canManage }: Props) {
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
  const tone = toneFor(status);
  const className = `text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${tone}`;

  if (!canManage) {
    return (
      <span className={className} title="Status da assinatura">
        {label}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={openPortal}
      disabled={loading}
      title="Gerenciar assinatura"
      className={`${className} hover:opacity-90 disabled:opacity-50`}
    >
      {loading ? "..." : label}
    </button>
  );
}

function labelFor(status: Props["status"], periodEnd: string | null): string {
  if (status === "past_due") return "Pagamento pendente";
  if (!periodEnd) return status === "trialing" ? "Teste ativo" : "Plano ativo";

  const daysLeft = Math.ceil((new Date(periodEnd).getTime() - Date.now()) / 86_400_000);

  if (status === "trialing") {
    if (daysLeft <= 0) return "Teste termina hoje";
    if (daysLeft === 1) return "Teste: 1 dia";
    return `Teste: ${daysLeft} dias`;
  }

  return "Plano ativo";
}

function toneFor(status: Props["status"]): string {
  if (status === "past_due") return "border-red-300 bg-red-50 text-red-700 hover:bg-red-100";
  if (status === "trialing") return "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100";
  return "border-green-300 bg-green-50 text-green-700 hover:bg-green-100";
}
