"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { validateCpf, formatCpf, normalizeCpf } from "@/lib/cpf";
import { normalizeCrmv, isValidCrmv } from "@/lib/crmv";
import { CRMV_STATE_OPTIONS } from "@/shared/constants";
import { inputCls } from "@/lib/ui";
import * as authApi from "@/lib/services/auth";
import { AccountError } from "@/lib/services/auth";
import type { AccountFieldError } from "@/shared/interfaces";

type FieldErrors = Partial<Record<NonNullable<AccountFieldError["field"]>, string>>;

function translateSignupError(code: string | undefined, fallback: string): string {
  switch (code) {
    case "user_already_exists":
    case "email_exists":
      return "Este email já está cadastrado. Faça login.";
    case "weak_password":
      return "Senha muito fraca. Use ao menos 8 caracteres.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    default:
      return fallback || "Erro ao criar conta. Tente novamente.";
  }
}

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [cpf, setCpf] = useState("");
  const [crmvState, setCrmvState] = useState("");
  const [crmv, setCrmv] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone] = useState(false);

  const supabase = createClient();
  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const cpfId = useId();
  const crmvStateId = useId();
  const crmvId = useId();

  async function handleGoogle() {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    if (error) {
      setError("Erro ao conectar com o Google. Tente novamente.");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fe: FieldErrors = {};
    if (!fullName.trim()) fe.full_name = "Informe seu nome completo.";
    if (!validateCpf(cpf)) fe.cpf = "CPF inválido.";
    if (!crmvState) fe.crmv_state = "Selecione o estado.";
    if (!isValidCrmv(crmv)) fe.crmv = "Número de CRMV inválido.";
    if (password.length < 8) fe.password = "Mínimo de 8 caracteres.";
    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const payload = {
      full_name: fullName.trim(),
      email: email.trim(),
      password,
      cpf: normalizeCpf(cpf),
      crmv: normalizeCrmv(crmv),
      crmv_state: crmvState,
    };

    try {
      await authApi.validateSignup(payload);

      const { data, error } = await supabase.auth.signUp({
        email: payload.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: payload.full_name,
            cpf: payload.cpf,
            crmv: payload.crmv,
            crmv_state: payload.crmv_state,
          },
        },
      });

      if (error) {
        setError(translateSignupError(error.code, error.message));
        return;
      }
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        setFieldErrors({ email: "Este email já está cadastrado. Faça login." });
        return;
      }
      setDone(true);
    } catch (err) {
      if (err instanceof AccountError && err.field) setFieldErrors({ [err.field]: err.message });
      else setError(err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Confirme seu email</h1>
          <p className="text-sm text-gray-600">
            Enviamos um link de confirmação para <span className="font-medium">{email}</span>. Confirme seu email para
            acessar sua conta.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
            Voltar para o login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar conta</h1>
        <p className="text-sm text-gray-500 mb-6">Laudos veterinários com IA</p>

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
            <label htmlFor={emailId} className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              required
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>}
          </div>

          <div>
            <label htmlFor={passwordId} className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <div className="relative">
              <input
                id={passwordId}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-16`}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-xs text-gray-500 hover:text-gray-700"
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
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
            disabled={loading || googleLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-400">ou</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || googleLoading}
          className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {googleLoading ? "Conectando..." : "Continuar com Google"}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
