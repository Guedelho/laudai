"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteReport } from "@/lib/api/reports";

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
      console.error("Delete report error");
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
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-red-600 font-medium hover:text-red-800 disabled:opacity-50"
        >
          {deleting ? "Excluindo..." : "Confirmar"}
        </button>
        <button
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
      onClick={() => {
        setConfirming(true);
        setDeleteError("");
      }}
      className="text-sm text-red-500 hover:text-red-700 print:hidden"
    >
      Excluir
    </button>
  );
}
