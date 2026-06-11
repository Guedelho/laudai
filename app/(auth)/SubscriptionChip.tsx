"use client";

import { useState } from "react";
import { openBillingPortal } from "@/lib/services/profile";

interface Props {
  status: "trialing" | "active" | "past_due";
  periodEnd: string | null;
  canManage: boolean;
}

export default function SubscriptionChip({ status, periodEnd, canManage }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function openPortal() {
    setLoading(true);
    setError("");
    try {
      window.location.href = await openBillingPortal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao abrir o portal.");
      setLoading(false);
    }
  }

  const effectiveStatus = isTrialLapsed(status, periodEnd) ? "active" : status;

  const label = labelFor(effectiveStatus, periodEnd);
  const tone = toneFor(effectiveStatus);
  const className = `text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${tone}`;

  if (!canManage) {
    return (
      <span className={className} title="Status da assinatura">
        {label}
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={openPortal}
        disabled={loading}
        title="Gerenciar assinatura"
        className={`${className} hover:opacity-90 disabled:opacity-50`}
      >
        {loading ? "..." : label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

// A trialing status whose period end has passed means Stripe has converted it and our
// mirror is just behind — show it as the active plan, not a stuck countdown.
function isTrialLapsed(status: Props["status"], periodEnd: string | null): boolean {
  return status === "trialing" && periodEnd !== null && new Date(periodEnd).getTime() <= Date.now();
}

function labelFor(status: Props["status"], periodEnd: string | null): string {
  if (status === "past_due") return "Pagamento pendente";
  if (!periodEnd) return status === "trialing" ? "Período de teste" : "Plano ativo";

  const daysLeft = Math.ceil((new Date(periodEnd).getTime() - Date.now()) / 86_400_000);

  if (status === "trialing") {
    if (daysLeft === 1) return "Período de teste: 1 dia";
    return `Período de teste: ${daysLeft} dias`;
  }

  return "Plano ativo";
}

function toneFor(status: Props["status"]): string {
  if (status === "past_due") return "border-red-300 bg-red-50 text-red-700 hover:bg-red-100";
  if (status === "trialing") return "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100";
  return "border-green-300 bg-green-50 text-green-700 hover:bg-green-100";
}
