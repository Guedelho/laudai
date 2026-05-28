"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { REPORT_STATUSES, type ReportStatus } from "@/shared/models";
import { useOrgReportsChannel } from "@/lib/hooks/use-org-reports-channel";

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

  useOrgReportsChannel<ReportRealtimeRow>(orgId, {
    onEvent: (payload) => {
      if (failed || payload.id !== reportId) return;
      if (payload.status === REPORT_STATUSES.completed || payload.status === REPORT_STATUSES.failed) {
        router.refresh();
      }
    },
  });

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
