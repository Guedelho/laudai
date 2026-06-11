"use client";

import { btnPrimary } from "@/lib/ui";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="max-w-lg mx-auto px-6 py-20 text-center">
      <h1 className="text-lg font-semibold text-gray-900 mb-2">Algo deu errado</h1>
      <p className="text-sm text-gray-500 mb-6">{error.message || "Erro inesperado. Tente novamente."}</p>
      <button type="button" onClick={reset} className={btnPrimary}>
        Tentar novamente
      </button>
    </main>
  );
}
