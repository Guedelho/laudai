"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btnBlock } from "@/lib/ui";
import PasswordInput from "@/components/PasswordInput";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const fe: { password?: string; confirm?: string } = {};
    if (password.length < 8) fe.password = "Mínimo de 8 caracteres.";
    if (confirm !== password) fe.confirm = "As senhas não coincidem.";
    if (Object.keys(fe).length) {
      setFieldErrors(fe);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError("Não foi possível redefinir a senha. O link pode ter expirado — solicite um novo.");
      setLoading(false);
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Criar nova senha</h1>
        <p className="text-sm text-gray-500 mb-6">Escolha uma nova senha para sua conta.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordInput
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            label="Nova senha"
            error={fieldErrors.password}
          />
          <PasswordInput
            value={confirm}
            onChange={setConfirm}
            autoComplete="new-password"
            label="Confirmar senha"
            error={fieldErrors.confirm}
          />

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className={btnBlock}>
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
