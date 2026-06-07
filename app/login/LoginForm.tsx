"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import PasswordInput from "@/components/PasswordInput";
import { inputCls, btnBlock, btnBlockSecondary } from "@/lib/ui";

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Laudai</h1>
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
          <button type="submit" disabled={loading || googleLoading} className={btnBlock}>
            {loading ? "Entrando..." : "Entrar"}
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

        <p className="mt-6 text-center text-sm text-gray-500">
          Não tem conta?{" "}
          <Link href="/signup" className="text-blue-600 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  );
}
