import Link from "next/link";
import type { ReactNode } from "react";

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/legal" className="text-lg font-semibold text-gray-900">
            Laudai
          </Link>
          <Link href="/login" className="text-sm text-blue-600 hover:underline">
            Voltar ao login
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-10">{children}</main>
    </div>
  );
}
