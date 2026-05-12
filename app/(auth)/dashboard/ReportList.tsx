"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimePostgresUpdatePayload } from "@supabase/supabase-js";
import { SPECIALTIES } from "@/lib/report/templates";
import { ReportStatus, ReportSummary } from "@/shared/models";
import { DASHBOARD_PAGE_SIZE } from "@/shared/constants";
import { createClient } from "@/lib/supabase/client";
import { listReports, regenerateReport } from "@/lib/services/reports";
import LoadingSkeleton from "@/components/LoadingSkeleton";

interface Props {
  userId: string;
}

type ReportRealtimeRow = ReportSummary & { deleted_at: string | null };

function toSummary(row: ReportRealtimeRow): ReportSummary {
  return {
    id: row.id,
    patient_name: row.patient_name,
    owner_name: row.owner_name,
    clinic_name: row.clinic_name,
    specialty: row.specialty,
    created_at: row.created_at,
    exam_date: row.exam_date,
    status: row.status,
    error_message: row.error_message,
  };
}

export default function ReportList({ userId }: Props) {
  const [query, setQuery] = useState("");
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const prevStatusRef = useRef<Map<string, ReportStatus>>(new Map());

  useEffect(() => {
    let cancelled = false;
    listReports(DASHBOARD_PAGE_SIZE)
      .then((data) => {
        if (cancelled) return;
        setReports(data);
        setHasMore(data.length === DASHBOARD_PAGE_SIZE);
        prevStatusRef.current = new Map(data.map((r) => [r.id, r.status]));
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
      const more = await listReports(DASHBOARD_PAGE_SIZE, last.created_at);
      setReports((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const additions = more.filter((r) => !seen.has(r.id));
        for (const r of additions) prevStatusRef.current.set(r.id, r.status);
        return [...prev, ...additions];
      });
      if (more.length < DASHBOARD_PAGE_SIZE) setHasMore(false);
    } catch (err) {
      console.error("Load more failed:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMoreRef.current();
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const hasInProgress = reports.some((r) => r.status === "pending" || r.status === "generating");

  useEffect(() => {
    if (!hasInProgress) return;

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    function handleUpdate(payload: RealtimePostgresUpdatePayload<ReportRealtimeRow>) {
      const row = payload.new;
      if (row.deleted_at) {
        prevStatusRef.current.delete(row.id);
        setReports((prev) => prev.filter((r) => r.id !== row.id));
        return;
      }
      const previous = prevStatusRef.current.get(row.id);
      if (previous && previous !== "completed" && row.status === "completed") {
        setToast(`Laudo de ${row.patient_name} pronto.`);
      }
      prevStatusRef.current.set(row.id, row.status);
      const summary = toSummary(row);
      setReports((prev) => {
        const idx = prev.findIndex((r) => r.id === summary.id);
        if (idx === -1) return prev;
        const next = prev.slice();
        next[idx] = summary;
        return next;
      });
    }

    async function init() {
      await supabase.realtime.setAuth();
      if (cancelled) return;

      channel = supabase
        .channel(`reports:${userId}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "reports", filter: `user_id=eq.${userId}` },
          handleUpdate,
        )
        .subscribe((status, err) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
            console.error(`Realtime channel ${status}`, err);
          }
        });
    }

    init();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, hasInProgress]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const filtered = useMemo(() => {
    if (!query.trim()) return reports;
    const q = query.toLowerCase();
    return reports.filter(
      (r) =>
        r.patient_name.toLowerCase().includes(q) ||
        r.owner_name.toLowerCase().includes(q) ||
        r.clinic_name.toLowerCase().includes(q),
    );
  }, [reports, query]);

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

  const showSentinel = !query.trim() && hasMore;

  if (loadingInitial) return <LoadingSkeleton rows={DASHBOARD_PAGE_SIZE} />;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por paciente ou responsável..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {!reports.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Nenhum laudo gerado ainda</p>
          <Link href="/new" className="text-blue-600 text-sm hover:underline">
            Gerar primeiro laudo
          </Link>
        </div>
      ) : !filtered.length ? (
        <div className="text-center py-16 text-gray-400">
          <p>Nenhum resultado para &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              retrying={retryingId === report.id}
              onRetry={() => handleRetry(report.id)}
            />
          ))}
          {showSentinel && (
            <div ref={sentinelRef} className="py-4 text-center text-xs text-gray-400">
              {loadingMore ? "Carregando..." : ""}
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
  const isPending = report.status === "pending" || report.status === "generating";
  const isFailed = report.status === "failed";

  const meta = (
    <>
      <p className="font-medium text-gray-900">
        {report.patient_name} · {report.owner_name}
      </p>
      <p className="text-sm text-gray-500">
        {SPECIALTIES[report.specialty].label} · {report.clinic_name}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Criado: {new Date(report.created_at).toLocaleDateString("pt-BR")}
        {report.exam_date && <> · Exame: {new Date(report.exam_date + "T12:00:00").toLocaleDateString("pt-BR")}</>}
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
            <span className="text-xs text-red-500">Falhou</span>
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
