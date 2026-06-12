"use client";

import { useEffect, useRef, useState } from "react";
import ImageLightbox from "@/components/ImageLightbox";
import { MAX_REPORT_IMAGES, MAX_IMAGE_FILE_SIZE } from "@/shared/constants";

export default function ImagePicker({
  title,
  emptyText,
  onFilesChange,
  children,
}: {
  title: string;
  emptyText: string;
  onFilesChange: (files: File[]) => void;
  children?: React.ReactNode;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const urlsRef = useRef<string[]>([]);

  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);
  useEffect(() => () => urlsRef.current.forEach(URL.revokeObjectURL), []);

  function update(nextFiles: File[], nextUrls: string[]) {
    setFiles(nextFiles);
    setUrls(nextUrls);
    onFilesChange(nextFiles);
  }

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const selected = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = "";
    if (!selected.length) return;
    const valid = selected.filter((f) => {
      if (f.size > MAX_IMAGE_FILE_SIZE) {
        setError(`Imagem "${f.name}" excede 5 MB.`);
        return false;
      }
      return true;
    });
    const remaining = MAX_REPORT_IMAGES - files.length;
    if (remaining <= 0) {
      setError(`Limite de ${MAX_REPORT_IMAGES} imagens atingido.`);
      return;
    }
    const capped = valid.slice(0, remaining);
    if (capped.length < valid.length) {
      setError(
        `Limite de ${MAX_REPORT_IMAGES} imagens. Apenas ${capped.length} adicionada${capped.length !== 1 ? "s" : ""}.`,
      );
    }
    update([...files, ...capped], [...urls, ...capped.map((f) => URL.createObjectURL(f))]);
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(urls[index]);
    update(
      files.filter((_, i) => i !== index),
      urls.filter((_, i) => i !== index),
    );
    if (lightboxIndex !== null) {
      if (index === lightboxIndex) setLightboxIndex(null);
      else if (index < lightboxIndex) setLightboxIndex(lightboxIndex - 1);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          {title}
          {files.length > 0 && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              {files.length}/{MAX_REPORT_IMAGES}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= MAX_REPORT_IMAGES}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Adicionar imagens
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {files.map((file, i) => (
            <div key={urls[i]} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urls[i]}
                alt={file.name}
                onClick={() => setLightboxIndex(i)}
                className="aspect-[4/3] w-full cursor-pointer rounded-lg border border-gray-200 bg-black object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label="Remover imagem"
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">{emptyText}</p>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={urls.map((url) => ({ key: url, src: url }))}
          selectedIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={(i) => {
            removeFile(i);
            setLightboxIndex(null);
          }}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {children}
    </div>
  );
}
