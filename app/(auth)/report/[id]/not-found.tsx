import Link from "next/link";
import { btnPrimary } from "@/lib/ui";

export default function LaudoNotFound() {
  return (
    <main className="max-w-lg mx-auto px-6 py-20 text-center">
      <h1 className="text-lg font-semibold text-gray-900 mb-2">Laudo não encontrado</h1>
      <p className="text-sm text-gray-500 mb-6">Este laudo não existe ou foi excluído.</p>
      <Link href="/dashboard" className={btnPrimary}>
        Voltar aos laudos
      </Link>
    </main>
  );
}
