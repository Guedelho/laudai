"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { inputCls, btnBlock, btnBlockSecondary } from "@/lib/ui";
import { validateAccountFields, normalizeAccount, type FieldErrors } from "@/lib/account";
import * as authApi from "@/lib/services/auth";
import { AccountError } from "@/lib/services/auth";
import CpfCrmvFields from "@/components/CpfCrmvFields";
import PasswordInput from "@/components/PasswordInput";

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

    const fe = validateAccountFields({ full_name: fullName, cpf, crmv, crmv_state: crmvState });
    if (password.length < 8) fe.password = "Mínimo de 8 caracteres.";
    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const profile = normalizeAccount({ full_name: fullName, cpf, crmv, crmv_state: crmvState });

    try {
      await authApi.validateSignup({ ...profile, email: email.trim(), password });

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback`, data: profile },
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

          <div>
            <label htmlFor={emailId} className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              aria-invalid={!!fieldErrors.email}
              aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
              required
            />
            {fieldErrors.email && (
              <p id={`${emailId}-error`} role="alert" className="mt-1 text-xs text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            error={fieldErrors.password}
          />

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

          <button type="submit" disabled={loading || googleLoading} className={btnBlock}>
            {loading ? "Criando conta..." : "Criar conta"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-xs text-gray-500">ou</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <button type="button" onClick={handleGoogle} disabled={loading || googleLoading} className={btnBlockSecondary}>
          {googleLoading ? "Conectando..." : "Continuar com Google"}
        </button>

        <p className="mt-4 text-center text-[11px] text-gray-500">
          Ao criar conta, você concorda com os{" "}
          <Link href="/legal/termos-de-uso" target="_blank" className="text-blue-600 hover:underline">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/legal/politica-de-privacidade" target="_blank" className="text-blue-600 hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>

        <p className="mt-4 text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
