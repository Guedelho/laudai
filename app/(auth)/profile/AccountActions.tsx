"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import * as profileApi from "@/lib/services/profile";
import { logout } from "@/app/actions/auth";

const DELETION_GRACE_DAYS = 30;

function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="text-sm text-gray-500 hover:text-gray-600 disabled:opacity-50">
      {pending ? "Saindo..." : "Sair da conta"}
    </button>
  );
}

function purgeDateLabel(scheduledAt: string): string {
  const purgeAt = new Date(new Date(scheduledAt).getTime() + DELETION_GRACE_DAYS * 86_400_000);
  return purgeAt.toLocaleDateString("pt-BR");
}

function DeletionScheduledBanner({ scheduledAt, onCancelled }: { scheduledAt: string; onCancelled: () => void }) {
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  async function handleCancel() {
    setCancelling(true);
    setError("");
    try {
      await profileApi.cancelAccountDeletion();
      onCancelled();
    } catch {
      setError("Erro ao cancelar a exclusão. Tente novamente.");
      setCancelling(false);
    }
  }

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
      <p className="text-xs text-red-900">
        A exclusão da sua conta está agendada: seus dados serão apagados permanentemente em{" "}
        {purgeDateLabel(scheduledAt)}.
      </p>
      <button
        type="button"
        onClick={handleCancel}
        disabled={cancelling}
        className="text-xs bg-white border border-red-300 text-red-700 px-3 py-1.5 rounded hover:bg-red-100 disabled:opacity-50"
      >
        {cancelling ? "Cancelando..." : "Cancelar exclusão"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function AccountActions({ deletionScheduledAt }: { deletionScheduledAt: string | null }) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const router = useRouter();

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      await profileApi.deleteAccount();
      setDeleteConfirm(false);
      router.refresh();
    } catch {
      setDeleteError("Erro ao excluir conta. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-lg space-y-6">
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-gray-900">Privacidade</h2>
        <div className="flex flex-col gap-2">
          {deletionScheduledAt ? (
            <DeletionScheduledBanner scheduledAt={deletionScheduledAt} onCancelled={() => router.refresh()} />
          ) : !deleteConfirm ? (
            <button
              type="button"
              onClick={() => setDeleteConfirm(true)}
              className="text-sm text-red-600 hover:underline w-fit"
            >
              Excluir minha conta
            </button>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
              <p className="text-xs text-red-900">
                Seu perfil, laudos, imagens e PDFs serão apagados permanentemente em {DELETION_GRACE_DAYS} dias. Até lá,
                você pode cancelar a exclusão nesta página.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Excluindo..." : "Confirmar exclusão"}
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(false)}
                  className="text-xs text-gray-600 hover:text-gray-900 px-3 py-1.5"
                >
                  Cancelar
                </button>
              </div>
              {deleteError && <p className="text-xs text-red-600">{deleteError}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <form action={logout}>
          <LogoutButton />
        </form>
      </div>
    </div>
  );
}
