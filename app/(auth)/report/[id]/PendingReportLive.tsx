"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { REPORT_STATUSES, type ReportStatus } from "@/shared/models";
import { createClient } from "@/lib/supabase/client";

interface Props {
  reportId: string;
  orgId: string;
  status: string;
  errorMessage: string | null;
}

type ReportRealtimeRow = { id: string; status: ReportStatus };

// The report page is a cached Server Component, so a freshly-enqueued laudo lands
// here while still pending. Subscribe to the same org broadcast the dashboard uses
// and refresh the route once this report reaches a terminal status.
export default function PendingReportLive({ reportId, orgId, status, errorMessage }: Props) {
  const router = useRouter();
  const failed = status === REPORT_STATUSES.failed;

  useEffect(() => {
    if (failed) return;
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function init() {
      await supabase.realtime.setAuth();
      if (cancelled) return;
      channel = supabase
        .channel(`org:${orgId}:reports`, { config: { private: true } })
        .on<ReportRealtimeRow>("broadcast", { event: "report_changed" }, ({ payload }) => {
          if (payload.id !== reportId) return;
          if (payload.status === REPORT_STATUSES.completed || payload.status === REPORT_STATUSES.failed) {
            router.refresh();
          }
        })
        .subscribe((s, err) => {
          if (s === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR || s === REALTIME_SUBSCRIBE_STATES.TIMED_OUT) {
            console.error(`Realtime channel ${s}`, err);
          }
        });
    }

    init();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [reportId, orgId, failed, router]);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12 text-center">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 mb-8 inline-block">
        ← Laudos
      </Link>
      {failed ? (
        <>
          <p className="text-lg font-semibold text-red-600 mb-2">Falha ao gerar laudo</p>
          <p className="text-sm text-gray-500">{errorMessage ?? "Tente novamente pelo painel."}</p>
        </>
      ) : (
        <>
          <p className="text-lg font-semibold text-gray-900 mb-2">Gerando laudo...</p>
          <p className="text-sm text-gray-500">Esta página será atualizada automaticamente quando ficar pronto.</p>
        </>
      )}
    </main>
  );
}
