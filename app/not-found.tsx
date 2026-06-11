import Link from "next/link";
import { btnPrimary } from "@/lib/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Página não encontrada</h2>
        <p className="text-sm text-gray-500 mb-6">A página que você procura não existe.</p>
        <Link href="/dashboard" className={btnPrimary}>
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
