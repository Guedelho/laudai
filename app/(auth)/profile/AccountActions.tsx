"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import * as profileApi from "@/lib/services/profile";
import { logout } from "@/app/actions/auth";

function LogoutButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="text-sm text-gray-500 hover:text-gray-600 disabled:opacity-50">
      {pending ? "Saindo..." : "Sair da conta"}
    </button>
  );
}

export default function AccountActions() {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [exportError, setExportError] = useState("");
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setExportError("");
    setDownloading(true);
    try {
      await profileApi.downloadAccountExport();
    } catch {
      setExportError("Erro ao baixar seus dados. Tente novamente.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setDeleteError("");
    try {
      await profileApi.deleteAccount();
      window.location.href = "/login";
    } catch {
      setDeleteError("Erro ao excluir conta. Tente novamente.");
      setDeleting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 w-full max-w-lg space-y-6">
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Privacidade</h2>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={downloading}
            className="text-sm text-blue-600 hover:underline w-fit text-left disabled:opacity-50"
          >
            {downloading ? "Baixando..." : "Baixar meus dados (JSON)"}
          </button>
          {exportError && <p className="text-xs text-red-600">{exportError}</p>}
          {!deleteConfirm ? (
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
                Excluir a conta apaga permanentemente seu perfil, laudos, imagens e PDFs. Esta ação é irreversível.
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
