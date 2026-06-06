"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { validateCpf, formatCpf, normalizeCpf } from "@/lib/cpf";
import { normalizeCrmv, isValidCrmv } from "@/lib/crmv";
import { CRMV_STATE_OPTIONS } from "@/shared/constants";
import { inputCls } from "@/lib/ui";
import * as authApi from "@/lib/services/auth";
import { AccountError } from "@/lib/services/auth";
import type { AccountFieldError } from "@/shared/interfaces";

type FieldErrors = Partial<Record<NonNullable<AccountFieldError["field"]>, string>>;

export default function OnboardingForm({ initialFullName }: { initialFullName: string }) {
  const [fullName, setFullName] = useState(initialFullName);
  const [cpf, setCpf] = useState("");
  const [crmvState, setCrmvState] = useState("");
  const [crmv, setCrmv] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const fullNameId = useId();
  const cpfId = useId();
  const crmvStateId = useId();
  const crmvId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fe: FieldErrors = {};
    if (!fullName.trim()) fe.full_name = "Informe seu nome completo.";
    if (!validateCpf(cpf)) fe.cpf = "CPF inválido.";
    if (!crmvState) fe.crmv_state = "Selecione o estado.";
    if (!isValidCrmv(crmv)) fe.crmv = "Número de CRMV inválido.";
    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      await authApi.submitOnboarding({
        full_name: fullName.trim(),
        cpf: normalizeCpf(cpf),
        crmv: normalizeCrmv(crmv),
        crmv_state: crmvState,
      });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof AccountError && err.field) setFieldErrors({ [err.field]: err.message });
      else setError(err instanceof Error ? err.message : "Erro ao concluir cadastro. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete seu cadastro</h1>
        <p className="text-sm text-gray-500 mb-6">CPF e CRMV são exigidos para emissão do laudo.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={fullNameId} className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              id={fullNameId}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputCls}
              placeholder="Dra. Tatiana Brasil"
              required
            />
            {fieldErrors.full_name && <p className="mt-1 text-xs text-red-600">{fieldErrors.full_name}</p>}
          </div>

          <div>
            <label htmlFor={cpfId} className="block text-sm font-medium text-gray-700 mb-1">
              CPF
            </label>
            <input
              id={cpfId}
              type="text"
              inputMode="numeric"
              value={cpf}
              onChange={(e) => setCpf(formatCpf(e.target.value))}
              className={inputCls}
              placeholder="000.000.000-00"
              required
            />
            {fieldErrors.cpf && <p className="mt-1 text-xs text-red-600">{fieldErrors.cpf}</p>}
          </div>

          <div className="flex gap-3">
            <div className="w-28">
              <label htmlFor={crmvStateId} className="block text-sm font-medium text-gray-700 mb-1">
                UF
              </label>
              <select
                id={crmvStateId}
                value={crmvState}
                onChange={(e) => setCrmvState(e.target.value)}
                className={inputCls}
                required
              >
                <option value="">—</option>
                {CRMV_STATE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.value}
                  </option>
                ))}
              </select>
              {fieldErrors.crmv_state && <p className="mt-1 text-xs text-red-600">{fieldErrors.crmv_state}</p>}
            </div>
            <div className="flex-1">
              <label htmlFor={crmvId} className="block text-sm font-medium text-gray-700 mb-1">
                CRMV
              </label>
              <input
                id={crmvId}
                type="text"
                value={crmv}
                onChange={(e) => setCrmv(e.target.value)}
                className={inputCls}
                placeholder="00000"
                required
              />
              {fieldErrors.crmv && <p className="mt-1 text-xs text-red-600">{fieldErrors.crmv}</p>}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Concluindo..." : "Concluir cadastro"}
          </button>
        </form>
      </div>
    </div>
  );
}
