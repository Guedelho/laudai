"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteReport } from "@/lib/services/reports";
import { btnDanger } from "@/lib/ui";

export default function DeleteReportButton({ reportId }: { reportId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteReport(reportId);
      router.push("/dashboard");
    } catch {
      setDeleting(false);
      setConfirming(false);
      setDeleteError("Erro ao excluir laudo. Tente novamente.");
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2 print:hidden">
        <span className="text-sm text-gray-600">Excluir laudo?</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-600 font-medium hover:text-red-800 disabled:opacity-50"
        >
          {deleting ? "Excluindo..." : "Confirmar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setDeleteError("");
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
        {deleteError && <span className="text-sm text-red-600">{deleteError}</span>}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setConfirming(true);
        setDeleteError("");
      }}
      aria-label="Excluir laudo"
      title="Excluir laudo"
      className={`${btnDanger} print:hidden`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
        />
      </svg>
      <span className="hidden sm:inline">Excluir</span>
    </button>
  );
}
