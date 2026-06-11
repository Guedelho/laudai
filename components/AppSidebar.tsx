"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Laudos" },
  { href: "/pets", label: "Pacientes" },
  { href: "/clients", label: "Clientes" },
  { href: "/new/chat", label: "Assistente" },
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

function SettingsLink({ active, onNavigate }: { active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href="/profile"
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      title="Configurações"
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.076.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
      Configurações
    </Link>
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
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <UserChip email={userEmail} />
            </div>
            <SettingsLink active={pathname.startsWith("/profile")} />
          </div>
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

            <div className="mt-auto flex items-center gap-2 pt-6">
              <div className="min-w-0 flex-1">
                <UserChip email={userEmail} />
              </div>
              <SettingsLink active={pathname.startsWith("/profile")} onNavigate={close} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
