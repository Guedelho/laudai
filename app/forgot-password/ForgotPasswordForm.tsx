"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { inputCls, btnBlock } from "@/lib/ui";
import AuthCard from "@/components/AuthCard";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();
  const emailId = useId();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError("Não foi possível enviar o email. Tente novamente.");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <AuthCard center>
        <div role="status">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Verifique seu email</h1>
          <p className="text-sm text-gray-600">
            Se existir uma conta com esse email, enviamos um link para redefinir a senha.
          </p>
        </div>
        <Link href="/login" className="mt-6 inline-block text-sm text-blue-600 hover:underline">
          Voltar para o login
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Redefinir senha</h1>
      <p className="text-sm text-gray-500 mb-6">Informe seu email e enviaremos um link para criar uma nova senha.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button type="submit" disabled={loading} className={btnBlock}>
          {loading ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link href="/login" className="text-blue-600 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </AuthCard>
  );
}
