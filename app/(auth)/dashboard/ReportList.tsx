"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SPECIALTIES } from "@/lib/report/templates";
import { REPORT_STATUSES, ReportSummary } from "@/shared/models";
import { DASHBOARD_PAGE_SIZE } from "@/shared/constants";
import { listReports, regenerateReport } from "@/lib/services/reports";
import { formatExamDate } from "@/lib/utils";
import { useOrgReportsChannel } from "@/lib/hooks/use-org-reports-channel";
import LoadingSkeleton from "@/components/LoadingSkeleton";

interface Props {
  userId: string;
  orgId: string;
}

type ReportRealtimeRow = ReportSummary & { event: "insert" | "update" | "delete"; deleted_at: string | null };

function toSummary(row: ReportRealtimeRow): ReportSummary {
  return {
    id: row.id,
    patient_name: row.patient_name,
    owner_name: row.owner_name,
    client_name: row.client_name,
    specialty: row.specialty,
    created_at: row.created_at,
    exam_date: row.exam_date,
    status: row.status,
    error_message: row.error_message,
  };
}

export default function ReportList({ userId, orgId }: Props) {
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ReportSummary[] | null>(null);
  const [searching, setSearching] = useState(false);
  const knownCompletedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    listReports(DASHBOARD_PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        setReports(data);
        setHasMore(data.length === DASHBOARD_PAGE_SIZE);
        for (const r of data) if (r.status === REPORT_STATUSES.completed) knownCompletedRef.current.add(r.id);
      })
      .catch((err) => console.error("Initial dashboard load failed:", err))
      .finally(() => {
        if (!cancelled) setLoadingInitial(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const loadMoreRef = useRef<() => Promise<void>>(() => Promise.resolve());
  loadMoreRef.current = async () => {
    if (loadingMore || !hasMore || reports.length === 0) return;
    setLoadingMore(true);
    try {
      const last = reports[reports.length - 1];
      const more = await listReports(DASHBOARD_PAGE_SIZE, { before: last.created_at });
      setReports((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const additions = more.filter((r) => !seen.has(r.id));
        for (const r of additions) if (r.status === REPORT_STATUSES.completed) knownCompletedRef.current.add(r.id);
        return [...prev, ...additions];
      });
      if (more.length < DASHBOARD_PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  function maybeToastCompletion(row: ReportRealtimeRow) {
    if (row.status !== REPORT_STATUSES.completed) return;
    if (knownCompletedRef.current.has(row.id)) return;
    knownCompletedRef.current.add(row.id);
    setToast(`Laudo de ${row.patient_name} pronto.`);
  }

  function handleChange(row: ReportRealtimeRow) {
    if (row.event === "delete" || row.deleted_at) {
      knownCompletedRef.current.delete(row.id);
      setReports((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }
    const summary = toSummary(row);
    if (row.event === "insert") {
      setReports((prev) => (prev.some((r) => r.id === summary.id) ? prev : [summary, ...prev]));
    } else {
      setReports((prev) => {
        const idx = prev.findIndex((r) => r.id === summary.id);
        if (idx === -1) return [summary, ...prev];
        const next = prev.slice();
        next[idx] = summary;
        return next;
      });
    }
    maybeToastCompletion(row);
  }

  useOrgReportsChannel<ReportRealtimeRow>(orgId, { onEvent: handleChange });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchResults(null);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await listReports(50, { q, signal: controller.signal });
        if (!controller.signal.aborted) setSearchResults(results);
      } catch (err) {
        if (!controller.signal.aborted) console.error("Search failed:", err);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const displayList = searchResults ?? reports;

  async function handleRetry(id: string) {
    setRetryingId(id);
    try {
      await regenerateReport(id);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao reenviar laudo.");
    } finally {
      setRetryingId(null);
    }
  }

  const showLoadMore = !query.trim() && hasMore;

  if (loadingInitial) return <LoadingSkeleton rows={DASHBOARD_PAGE_SIZE} />;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por paciente ou responsável..."
        aria-label="Buscar laudos"
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {query.trim() && searching && !searchResults ? (
        <div className="text-center py-16 text-gray-500 text-sm">Buscando...</div>
      ) : !displayList.length ? (
        query.trim() ? (
          <div className="text-center py-16 text-gray-500">
            <p>Nenhum resultado para &ldquo;{query}&rdquo;</p>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            <p className="text-lg mb-2">Nenhum laudo gerado ainda</p>
            <Link href="/new" className="text-blue-600 text-sm hover:underline">
              Gerar primeiro laudo
            </Link>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {displayList.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              retrying={retryingId === report.id}
              onRetry={() => handleRetry(report.id)}
            />
          ))}
          {showLoadMore && (
            <div className="py-4 text-center">
              <button
                type="button"
                onClick={() => loadMoreRef.current()}
                disabled={loadingMore}
                className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
              >
                {loadingMore ? "Carregando..." : "Carregar mais"}
              </button>
            </div>
          )}
        </div>
      )}

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg max-w-sm"
        >
          {toast}
        </div>
      )}
    </div>
  );
}

function ReportRow({ report, retrying, onRetry }: { report: ReportSummary; retrying: boolean; onRetry: () => void }) {
  const isPending = report.status === REPORT_STATUSES.pending || report.status === REPORT_STATUSES.generating;
  const isFailed = report.status === REPORT_STATUSES.failed;

  const meta = (
    <>
      <p className="font-medium text-gray-900">
        {report.patient_name} · {report.owner_name}
      </p>
      <p className="text-sm text-gray-500">
        {SPECIALTIES[report.specialty].label} · {report.client_name}
      </p>
      <p className="text-xs text-gray-500 mt-1">
        Criado: {new Date(report.created_at).toLocaleDateString("pt-BR")}
        {report.exam_date && <> · Exame: {formatExamDate(report.exam_date)}</>}
      </p>
    </>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-3">
      <div className="min-w-0">{meta}</div>
      <div className="shrink-0">
        {isPending ? (
          <span className="inline-flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Gerando laudo...
          </span>
        ) : isFailed ? (
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs text-red-600">Falhou</span>
            <button
              type="button"
              onClick={onRetry}
              disabled={retrying}
              className="text-sm text-blue-600 hover:underline disabled:opacity-50"
            >
              {retrying ? "Reenviando..." : "Tentar novamente"}
            </button>
          </div>
        ) : (
          <Link href={`/report/${report.id}`} className="text-sm text-blue-600 hover:underline">
            Ver laudo
          </Link>
        )}
      </div>
    </div>
  );
}
