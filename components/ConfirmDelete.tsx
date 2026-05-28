"use client";

import { useState } from "react";

interface Props {
  /** What the user is about to delete — used in the prompt copy. */
  noun: string;
  /** Performs the actual deletion. Throw on failure to show the error inline. */
  onConfirm: () => Promise<void>;
  /** Label for the trigger button. Default: "Excluir". */
  label?: string;
  /** Disables the trigger (e.g. while a parent operation is in flight). */
  disabled?: boolean;
}

// Inline confirm-delete pattern used across pets, clients, vets, and reports.
// Two-click destructive action: first click reveals Confirmar/Cancelar; second
// click performs the delete.
export default function ConfirmDelete({ noun, onConfirm, label = "Excluir", disabled }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm() {
    setBusy(true);
    setError("");
    try {
      await onConfirm();
      setConfirming(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao excluir ${noun.toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => {
          setConfirming(true);
          setError("");
        }}
        disabled={disabled}
        className="text-xs text-red-600 hover:text-red-700 disabled:opacity-40"
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-600">Excluir {noun.toLowerCase()}?</span>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={busy}
        className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
      >
        {busy ? "Excluindo..." : "Confirmar"}
      </button>
      <button
        type="button"
        onClick={() => {
          setConfirming(false);
          setError("");
        }}
        disabled={busy}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Cancelar
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
