"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface LaudoImage {
  id: string;
  file_name: string;
  url: string;
}

export default function ImageManager({
  laudoId,
  initialImages,
}: {
  laudoId: string;
  initialImages: LaudoImage[];
}) {
  const [images, setImages] = useState<LaudoImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function getAuthHeader(): Promise<Record<string, string>> {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    setUploading(true);
    setError("");

    try {
      const authHeader = await getAuthHeader();
      const formData = new FormData();
      files.forEach((f) => formData.append("images", f));

      const res = await fetch(`/api/laudos/${laudoId}/images`, {
        method: "POST",
        headers: authHeader,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setImages((prev) => [...prev, ...data.images]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(imageId: string) {
    try {
      const authHeader = await getAuthHeader();
      const res = await fetch(`/api/laudos/${laudoId}/images/${imageId}`, {
        method: "DELETE",
        headers: authHeader,
      });
      if (!res.ok) throw new Error("Erro ao remover imagem.");
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover imagem.");
    }
  }

  if (!images.length && typeof window !== "undefined" && window.matchMedia("print").matches) {
    return null;
  }

  return (
    <div className="mt-6">
      {/* Header — hidden when printing */}
      <div className="print:hidden flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">Imagens do exame</p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "Adicionar imagem"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {error && <p className="print:hidden text-sm text-red-500 mb-3">{error}</p>}

      {images.length > 0 && (
        <>
          {/* Print label */}
          <p className="hidden print:block text-sm font-semibold text-gray-700 mb-3">
            Imagens do exame
          </p>
          <div className="grid grid-cols-2 gap-4">
            {images.map((img) => (
              <div key={img.id} className="relative group">
                <Image
                  src={img.url}
                  alt={img.file_name}
                  width={600}
                  height={400}
                  className="w-full rounded-lg border border-gray-200 object-contain bg-black"
                />
                <button
                  onClick={() => handleDelete(img.id)}
                  className="print:hidden absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {!images.length && (
        <p className="print:hidden text-sm text-gray-400 italic">
          Nenhuma imagem adicionada
        </p>
      )}
    </div>
  );
}
