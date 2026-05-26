"use client";

import { useRef, useState } from "react";
import * as profileApi from "@/lib/services/profile";

export default function OrgLogo({ hasLogo }: { hasLogo: boolean }) {
  const [version, setVersion] = useState(() => (hasLogo ? Date.now() : 0));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      await profileApi.uploadOrgLogo(file);
      setVersion(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar logo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove() {
    setError("");
    try {
      await profileApi.removeOrgLogo();
      setVersion(0);
    } catch {
      setError("Erro ao remover logo.");
    }
  }

  const src = version ? `/api/org/logo?v=${version}` : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 w-full max-w-lg mb-6">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Organização</h2>
      <p className="text-sm text-gray-500 mb-4">O logo aparece em todos os laudos da sua organização.</p>

      <label className="block text-sm font-medium text-gray-700 mb-2">Logo do laudo</label>
      <div className="flex flex-col gap-3">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt="Logo"
            className="max-h-48 w-full object-contain rounded border border-gray-200 bg-gray-50 p-2"
          />
        ) : (
          <div className="h-48 w-full rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-sm text-gray-500">
            Sem logo
          </div>
        )}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {uploading ? "Enviando..." : src ? "Alterar" : "Enviar logo"}
          </button>
          {src && (
            <button type="button" onClick={handleRemove} className="text-sm text-red-600 hover:text-red-700">
              Remover
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-xs text-gray-500">JPEG ou PNG · máx. 5 MB</p>
    </div>
  );
}
