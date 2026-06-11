"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Laudos" },
  { href: "/pets", label: "Pacientes" },
  { href: "/clients", label: "Clientes" },
  { href: "/profile", label: "Perfil" },
];

interface Props {
  subscriptionChip?: React.ReactNode;
  userEmail?: string | null;
}

function NavList({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_LINKS.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? "bg-blue-50 font-medium text-blue-700" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserChip({ email }: { email?: string | null }) {
  if (!email) return null;
  const initial = email.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
        {initial}
      </span>
      <span className="truncate text-xs text-gray-600" title={email}>
        {email}
      </span>
    </div>
  );
}

export default function AppSidebar({ subscriptionChip, userEmail }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white px-4 py-5 md:flex">
        <div className="border-b border-gray-200 px-1 pb-4">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900">
            Laudai
          </Link>
        </div>

        <div className="mt-4">
          <NavList pathname={pathname} />
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-6">
          {subscriptionChip && <div className="px-1">{subscriptionChip}</div>}
          <UserChip email={userEmail} />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <Link href="/dashboard" className="text-lg font-bold text-gray-900">
          Laudai
        </Link>
        <div className="flex items-center gap-2">
          {subscriptionChip}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Abrir menu"
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Fechar menu" onClick={close} className="absolute inset-0 bg-black/30" />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-gray-200 bg-white px-4 py-5"
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">Laudai</span>
              <button
                type="button"
                onClick={close}
                aria-label="Fechar menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mt-6">
              <NavList pathname={pathname} onNavigate={close} />
            </div>

            <div className="mt-auto pt-6">
              <UserChip email={userEmail} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
