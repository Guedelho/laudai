"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

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
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between gap-3">
        <Link href="/dashboard" className="text-lg font-bold text-gray-900 shrink-0">
          Laudai
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-4">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm ${
                pathname.startsWith(l.href)
                  ? "font-medium text-gray-900 underline underline-offset-4"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {subscriptionChip}
          <Link
            href="/new"
            className="hidden sm:inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Novo Laudo
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <nav className="md:hidden border-t border-gray-200 px-6 py-3 flex flex-col gap-3 bg-white">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={close}
              className={`text-sm ${
                pathname.startsWith(l.href) ? "font-medium text-gray-900" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            href="/new"
            onClick={close}
            className="sm:hidden inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            Novo Laudo
          </Link>
        </nav>
      )}
    </header>
  );
}
