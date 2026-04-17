"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { LaudoImage } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function ImageManager({ initialImages, laudoId }: { initialImages: LaudoImage[]; laudoId: string }) {
  const [images, setImages] = useState<LaudoImage[]>(initialImages);
  const [selected, setSelected] = useState<LaudoImage | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  async function handleAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));
      const res = await fetch(`/api/laudos/${laudoId}/images`, { method: "POST", headers, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar imagens.");
      setImages((prev) => [...prev, ...data.images]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagens.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/laudos/${laudoId}/images/${imageId}`, { method: "DELETE", headers });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao remover imagem.");
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      if (selected?.id === imageId) setSelected(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover imagem.");
    }
  }

  return (
    <>
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">
            Imagens do exame
            {images.length > 0 && (
              <span className="ml-2 text-xs font-normal text-gray-400">{images.length}/30</span>
            )}
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || images.length >= 30}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? "Enviando..." : "Adicionar imagens"}
          </button>
          <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdd} />
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setSelected(img)}
                  className="w-full focus:outline-none rounded-lg overflow-hidden"
                >
                  <Image
                    src={img.url}
                    alt={img.file_name}
                    width={600}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="w-full rounded-lg border border-gray-200 object-contain bg-black hover:opacity-90 transition-opacity"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(img.id)}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Nenhuma imagem adicionada</p>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setSelected(null)}
        >
          <div className="relative max-w-4xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelected(null)}
              className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300"
            >
              Fechar ✕
            </button>
            <Image
              src={selected.url}
              alt={selected.file_name}
              width={1200}
              height={900}
              sizes="100vw"
              className="w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
