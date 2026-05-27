"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/dashboard", label: "Laudos" },
  { href: "/pets", label: "Pacientes" },
  { href: "/clients", label: "Clientes" },
  { href: "/profile", label: "Perfil" },
];

interface Props {
  subscriptionChip?: React.ReactNode;
}

export default function AppHeader({ subscriptionChip }: Props) {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="text-lg font-bold text-gray-900">
        Laudai
      </Link>
      <div className="flex items-center gap-4">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm ${pathname.startsWith(l.href) ? "font-medium text-gray-900 underline underline-offset-4" : "text-gray-500 hover:text-gray-900"}`}
          >
            {l.label}
          </Link>
        ))}
        {subscriptionChip}
        <Link
          href="/new/chat"
          className="border border-blue-600 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50"
        >
          Laudo Interativo
        </Link>
        <Link href="/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          Novo Laudo
        </Link>
      </div>
    </header>
  );
}
