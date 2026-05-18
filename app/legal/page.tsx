import Link from "next/link";

export const metadata = {
  title: "Documentos legais | Laudai",
};

export default function LegalIndex() {
  return (
    <div className="prose prose-sm max-w-none text-gray-800">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Documentos legais</h1>
      <ul className="space-y-3">
        <li>
          <Link href="/legal/politica-de-privacidade" className="text-blue-600 hover:underline">
            Política de Privacidade
          </Link>
        </li>
        <li>
          <Link href="/legal/termos-de-uso" className="text-blue-600 hover:underline">
            Termos de Uso
          </Link>
        </li>
      </ul>
    </div>
  );
}
