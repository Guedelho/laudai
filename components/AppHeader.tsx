"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./LogoutButton";

const NAV_LINKS = [
  { href: "/dashboard", label: "Laudos" },
  { href: "/pets", label: "Pacientes" },
  { href: "/clinics", label: "Clínicas" },
  { href: "/profile", label: "Perfil" },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link href="/dashboard" className="text-lg font-bold text-gray-900">
        Laudai
      </Link>
      <div className="flex items-center gap-4">
        <Link
          href="/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Novo Laudo
        </Link>
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm ${pathname.startsWith(l.href) ? "font-medium text-gray-900 underline underline-offset-4" : "text-gray-500 hover:text-gray-900"}`}
          >
            {l.label}
          </Link>
        ))}
        <LogoutButton />
      </div>
    </header>
  );
}
