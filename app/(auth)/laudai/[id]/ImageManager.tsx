"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { LaudoImage } from "@/shared/models";
import { ImagesResponse, ApiResponse } from "@/shared/interfaces";
import { getAuthHeaders } from "@/lib/supabase/client";
import ImageLightbox from "@/components/ImageLightbox";

export default function ImageManager({
  initialImages,
  laudoId,
  editable = false,
}: {
  initialImages: LaudoImage[];
  laudoId: string;
  editable?: boolean;
}) {
  const [images, setImages] = useState<LaudoImage[]>(initialImages);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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
      const data: ImagesResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao enviar imagens.");
      setImages((prev) => [...prev, ...(data.images ?? [])]);
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
        let data: ApiResponse = {};
        try {
          data = await res.json();
        } catch {
          /* ignore */
        }
        throw new Error(data.error || "Erro ao remover imagem.");
      }
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      setSelectedIndex((prev) => {
        if (prev === null) return null;
        const idx = images.findIndex((img) => img.id === imageId);
        if (idx === prev) return images.length <= 1 ? null : Math.min(prev, images.length - 2);
        if (idx < prev) return prev - 1;
        return prev;
      });
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
            {images.length > 0 && <span className="ml-2 text-xs font-normal text-gray-400">{images.length}/30</span>}
          </p>
          {editable && (
            <>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading || images.length >= 30}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {uploading ? "Enviando..." : "Adicionar imagens"}
              </button>
              <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAdd} />
            </>
          )}
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
                {editable && (
                  <button
                    type="button"
                    onClick={() => handleDelete(img.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Nenhuma imagem adicionada</p>
        )}
      </div>

      {selectedIndex !== null && (
        <ImageLightbox
          images={images.map((img) => ({ key: img.id, src: img.url, alt: img.file_name }))}
          selectedIndex={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}
    </>
  );
}
