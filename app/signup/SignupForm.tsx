"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/client/analytics";
import { inputCls, btnBlock } from "@/lib/ui";
import { validateAccountFields, normalizeAccount, type FieldErrors } from "@/lib/account";
import * as authApi from "@/lib/services/auth";
import { AccountError } from "@/lib/services/auth";
import CpfCrmvFields from "@/components/CpfCrmvFields";
import PasswordInput from "@/components/PasswordInput";
import AuthCard from "@/components/AuthCard";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [cpf, setCpf] = useState("");
  const [crmvState, setCrmvState] = useState("");
  const [crmv, setCrmv] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  const fullNameId = useId();
  const emailId = useId();

  async function handleResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendError("");
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setResending(false);
    if (error) setResendError("Não foi possível reenviar agora. Aguarde um momento.");
    else {
      setResent(true);
      setCooldown(60);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fe = validateAccountFields({ full_name: fullName, cpf, crmv, crmv_state: crmvState });
    if (password.length < 8) fe.password = "Mínimo de 8 caracteres.";
    const confirmErr = password !== confirmPassword ? "As senhas não coincidem." : "";
    if (Object.keys(fe).length || confirmErr) {
      setFieldErrors(fe);
      setConfirmError(confirmErr);
      return;
    }
    setFieldErrors({});
    setConfirmError("");
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
      trackEvent({ event: "sign_up" });
      setDone(true);
      setCooldown(60);
    } catch (err) {
      if (err instanceof AccountError && err.field) setFieldErrors({ [err.field]: err.message });
      else setError(err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <AuthCard center>
        <div role="status">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Confirme seu email</h1>
          <p className="text-sm text-gray-600">
            Enviamos um link de confirmação para <span className="font-medium">{email}</span>. Confirme seu email para
            acessar sua conta.
          </p>
        </div>
        <div className="mt-6">
          {resent && <p className="mb-1 text-sm text-green-600">Email reenviado.</p>}
          {cooldown > 0 ? (
            <p className="text-sm text-gray-500">Reenviar disponível em {cooldown}s</p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {resending ? "Reenviando..." : "Não recebeu? Reenviar email"}
            </button>
          )}
          {resendError && (
            <p role="alert" className="mt-1 text-xs text-red-600">
              {resendError}
            </p>
          )}
        </div>
        <Link href="/login" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          Voltar para o login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
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
            placeholder="Nome e sobrenome"
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
            placeholder="nome@clinica.com.br"
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

        <CpfCrmvFields
          cpf={cpf}
          setCpf={setCpf}
          crmvState={crmvState}
          setCrmvState={setCrmvState}
          crmv={crmv}
          setCrmv={setCrmv}
          errors={fieldErrors}
        />

        <PasswordInput
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          error={fieldErrors.password}
        />

        <PasswordInput
          value={confirmPassword}
          onChange={setConfirmPassword}
          label="Confirmar senha"
          autoComplete="new-password"
          error={confirmError}
        />

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={btnBlock}>
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="text-center text-xs text-gray-500">Enviaremos um link de confirmação para o seu email.</p>
      </form>

      <p className="mt-4 text-center text-xs text-gray-500">
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
    </AuthCard>
  );
}
