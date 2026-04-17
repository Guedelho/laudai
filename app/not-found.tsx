import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Página não encontrada</h2>
        <p className="text-sm text-gray-500 mb-6">A página que você procura não existe.</p>
        <Link
          href="/dashboard"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
