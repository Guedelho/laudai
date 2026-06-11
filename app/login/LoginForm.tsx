"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import AuthCard from "@/components/AuthCard";
import { inputCls, btnBlock } from "@/lib/ui";

function translateAuthError(code: string | undefined, fallback: string): string {
  switch (code) {
    case "invalid_credentials":
    case "user_not_found":
      return "Email ou senha incorretos.";
    case "email_not_confirmed":
      return "Email ainda não confirmado. Verifique sua caixa de entrada.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    default:
      return fallback || "Erro ao entrar. Tente novamente.";
  }
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(searchParams.get("error") ? "Não foi possível autenticar. Tente novamente." : "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const emailId = useId();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(translateAuthError(error.code, error.message));
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <AuthCard>
      <h1 className="mb-2">
        <img src="/logo.svg" alt="Laudai" width={168} height={56} className="h-11 w-auto" />
      </h1>
      <p className="text-sm text-gray-500 mb-6">Laudos veterinários com IA</p>

      <form onSubmit={handleLogin} className="space-y-4">
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
            required
          />
        </div>
        <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
        <div className="text-right">
          <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
            Esqueceu a senha?
          </Link>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className={btnBlock}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Não tem conta?{" "}
        <Link href="/signup" className="text-blue-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthCard>
  );
}
