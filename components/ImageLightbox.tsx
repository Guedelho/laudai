"use client";

import { useEffect, useRef, useState } from "react";

interface LightboxImage {
  key: string;
  src: string;
  alt?: string;
}

export default function ImageLightbox({
  images,
  selectedIndex,
  onClose,
  onDelete,
}: {
  images: LightboxImage[];
  selectedIndex: number;
  onClose: () => void;
  onDelete?: (index: number) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(selectedIndex);

  useEffect(() => {
    const ref = scrollRef.current;
    if (!ref) return;
    requestAnimationFrame(() => {
      const child = ref.children[currentIndex] as HTMLElement | undefined;
      child?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
    });
  }, [currentIndex]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(0, i - 1));
      else if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(images.length - 1, i + 1));
      else if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      <div className="flex justify-end gap-2 p-4">
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(currentIndex);
              onClose();
            }}
            className="text-white text-sm bg-red-500/70 px-3 py-1 rounded-full hover:bg-red-600/90"
          >
            Remover
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="text-white text-sm bg-black/50 px-3 py-1 rounded-full hover:bg-black/70"
        >
          Fechar ✕
        </button>
      </div>
      <div className="flex-1 w-full relative" onClick={(e) => e.stopPropagation()}>
        {currentIndex > 0 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i - 1)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg"
          >
            ‹
          </button>
        )}
        {currentIndex < images.length - 1 && (
          <button
            type="button"
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-lg"
          >
            ›
          </button>
        )}
        <div ref={scrollRef} className="w-full h-full overflow-x-auto overflow-y-hidden snap-x snap-mandatory flex">
          {images.map((img) => (
            <div
              key={img.key}
              className="snap-center shrink-0 w-screen h-full flex items-center justify-center px-6 pb-6"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src} alt={img.alt ?? ""} className="max-w-full max-h-full object-contain" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
