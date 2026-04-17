"use client";

import { useState } from "react";
import Image from "next/image";
import { LaudoImage } from "@/types";

export default function ImageManager({ initialImages }: { initialImages: LaudoImage[] }) {
  const [selected, setSelected] = useState<LaudoImage | null>(null);

  if (!initialImages.length) return null;

  return (
    <>
      <div className="mt-6">
        <p className="text-sm font-semibold text-gray-700 mb-3">Imagens do exame</p>
        <div className="grid grid-cols-2 gap-4">
          {initialImages.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelected(img)}
              className="focus:outline-none rounded-lg overflow-hidden"
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
          ))}
        </div>
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
