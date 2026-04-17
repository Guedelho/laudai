"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { LaudoImage } from "@/types";
import { createClient } from "@/lib/supabase/client";

export default function ImageManager({ initialImages, laudoId }: { initialImages: LaudoImage[]; laudoId: string }) {
  const [images, setImages] = useState<LaudoImage[]>(initialImages);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedIndex === null || !lightboxRef.current) return;
    const child = lightboxRef.current.children[selectedIndex] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
  }, [selectedIndex]);

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
      setSelectedIndex(null);
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
            {images.map((img, i) => (
              <div key={img.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setSelectedIndex(i)}
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

      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex flex-col"
          onClick={() => setSelectedIndex(null)}
        >
          <div className="flex justify-end p-4">
            <button
              onClick={() => setSelectedIndex(null)}
              className="text-white text-sm bg-black/50 px-3 py-1 rounded-full hover:bg-black/70"
            >
              Fechar ✕
            </button>
          </div>
          <div
            ref={lightboxRef}
            className="flex flex-1 overflow-x-auto snap-x snap-mandatory"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((img, i) => (
              <div key={i} className="snap-center flex-shrink-0 w-full flex items-center justify-center px-6 pb-6">
                <Image
                  src={img.url}
                  alt={img.file_name}
                  width={1200}
                  height={900}
                  sizes="100vw"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
