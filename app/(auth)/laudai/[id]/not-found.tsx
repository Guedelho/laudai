import Link from "next/link";

export default function LaudoNotFound() {
  return (
    <main className="max-w-lg mx-auto px-6 py-20 text-center">
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Laudo não encontrado</h2>
      <p className="text-sm text-gray-500 mb-6">Este laudo não existe ou foi excluído.</p>
      <Link
        href="/dashboard"
        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
      >
        Voltar aos laudos
      </Link>
    </main>
  );
}
