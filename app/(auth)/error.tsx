"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="max-w-lg mx-auto px-6 py-20 text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Algo deu errado</h2>
      <p className="text-sm text-gray-500 mb-6">{error.message || "Erro inesperado. Tente novamente."}</p>
      <button
        onClick={reset}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Tentar novamente
      </button>
    </main>
  );
}
