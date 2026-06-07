"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { inputCls, btnBlock } from "@/lib/ui";
import { validateAccountFields, normalizeAccount, type FieldErrors } from "@/lib/account";
import * as authApi from "@/lib/services/auth";
import { AccountError } from "@/lib/services/auth";
import { logout } from "@/app/actions/auth";
import Link from "next/link";
import CpfCrmvFields from "@/components/CpfCrmvFields";
import AuthCard from "@/components/AuthCard";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fe = validateAccountFields({ full_name: fullName, cpf, crmv, crmv_state: crmvState });
    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      await authApi.submitOnboarding(normalizeAccount({ full_name: fullName, cpf, crmv, crmv_state: crmvState }));
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      if (err instanceof AccountError && err.field) setFieldErrors({ [err.field]: err.message });
      else setError(err instanceof Error ? err.message : "Erro ao concluir cadastro. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <AuthCard>
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
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputCls}
            placeholder="Dra. Tatiana Brasil"
            aria-invalid={!!fieldErrors.full_name}
            aria-describedby={fieldErrors.full_name ? `${fullNameId}-error` : undefined}
            required
          />
          {fieldErrors.full_name && (
            <p id={`${fullNameId}-error`} role="alert" className="mt-1 text-xs text-red-600">
              {fieldErrors.full_name}
            </p>
          )}
        </div>

        <CpfCrmvFields
          cpf={cpf}
          setCpf={setCpf}
          crmvState={crmvState}
          setCrmvState={setCrmvState}
          crmv={crmv}
          setCrmv={setCrmv}
          errors={fieldErrors}
        />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={btnBlock}>
          {loading ? "Concluindo..." : "Concluir cadastro"}
        </button>
      </form>

      <p className="mt-4 text-center text-[11px] text-gray-500">
        Ao concluir, você concorda com os{" "}
        <Link href="/legal/termos-de-uso" target="_blank" className="text-blue-600 hover:underline">
          Termos de Uso
        </Link>{" "}
        e a{" "}
        <Link href="/legal/politica-de-privacidade" target="_blank" className="text-blue-600 hover:underline">
          Política de Privacidade
        </Link>
        .
      </p>

      <form action={logout} className="mt-4 text-center">
        <button type="submit" className="text-sm text-gray-500 hover:text-gray-600">
          Sair
        </button>
      </form>
    </AuthCard>
  );
}
