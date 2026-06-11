"use client";

import { useState } from "react";
import { btnSecondary } from "@/lib/ui";
import type { BillingOverview, InvoiceOverview, PlanOverview } from "@/shared/interfaces";

function money(amount: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
}

function date(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  paid: { label: "Pago", cls: "bg-green-50 text-green-700" },
  open: { label: "Em aberto", cls: "bg-amber-50 text-amber-700" },
  uncollectible: { label: "Não pago", cls: "bg-red-50 text-red-700" },
  void: { label: "Cancelado", cls: "bg-gray-100 text-gray-500" },
};

function ManageButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function openPortal() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error ?? "Erro ao abrir o portal.");
      window.location.href = body.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao abrir o portal.");
      setLoading(false);
    }
  }
  return (
    <div className="flex flex-col items-end gap-1">
      <button type="button" onClick={openPortal} disabled={loading} className={btnSecondary}>
        {loading ? "..." : "Gerenciar"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}

function PlanCard({ plan }: { plan: PlanOverview }) {
  const intervalLabel = plan.interval === "year" ? "Anual" : plan.interval === "month" ? "Mensal" : "—";
  const periodEndLabel = plan.trialing ? "Fim do teste" : "Próxima cobrança";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Plano</h2>
          <p className="text-sm text-gray-500">Sua assinatura e informações de cobrança.</p>
        </div>
        <ManageButton />
      </div>

      <dl className="mt-5 space-y-2.5 text-sm">
        <div className="flex items-center gap-2">
          <dt className="text-gray-500">Período:</dt>
          <dd className="font-medium text-gray-900">{intervalLabel}</dd>
        </div>
        {plan.currentPeriodEnd && (
          <div className="flex items-center gap-2">
            <dt className="text-gray-500">{periodEndLabel}:</dt>
            <dd className="font-medium text-gray-900">{date(plan.currentPeriodEnd)}</dd>
          </div>
        )}
        {plan.amount !== null && (
          <div className="flex items-center gap-2">
            <dt className="text-gray-500">Valor:</dt>
            <dd className="font-medium text-gray-900">
              {money(plan.amount, plan.currency)}
              <span className="text-gray-500">{plan.interval === "year" ? " /ano" : " /mês"}</span>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

function InvoicesCard({ invoices }: { invoices: InvoiceOverview[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-lg">
      <h2 className="text-base font-semibold text-gray-900">Faturas</h2>
      <p className="text-sm text-gray-500">Seu histórico de cobrança.</p>

      <ul className="mt-4 divide-y divide-gray-100">
        {invoices.map((inv) => {
          const badge = INVOICE_STATUS[inv.status] ?? INVOICE_STATUS.open;
          return (
            <li key={inv.id} className="flex items-center gap-3 py-3 text-sm">
              <span className="text-gray-500 shrink-0">{date(inv.created)}</span>
              <span className="text-gray-700">Assinatura Laudai</span>
              <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
                {badge.label}
              </span>
              <span className="shrink-0 font-medium text-gray-900">{money(inv.amount, inv.currency)}</span>
              {inv.hostedInvoiceUrl && (
                <a
                  href={inv.hostedInvoiceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-blue-600 hover:underline"
                >
                  Ver
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function BillingSection({ plan, invoices }: BillingOverview) {
  if (!plan && invoices.length === 0) return null;
  return (
    <>
      {plan && <PlanCard plan={plan} />}
      {invoices.length > 0 && <InvoicesCard invoices={invoices} />}
    </>
  );
}
