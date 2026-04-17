"use client";

import { useEffect, useRef } from "react";

interface LightboxImage {
  key: string;
  src: string;
  alt?: string;
}

export default function ImageLightbox({
  images,
  selectedIndex,
  onClose,
}: {
  images: LightboxImage[];
  selectedIndex: number;
  onClose: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ref = scrollRef.current;
    if (!ref) return;
    requestAnimationFrame(() => {
      const child = ref.children[selectedIndex] as HTMLElement | undefined;
      child?.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" });
    });
  }, [selectedIndex]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col"
      onClick={onClose}
    >
      <div className="flex justify-end p-4">
        <button
          type="button"
          onClick={onClose}
          className="text-white text-sm bg-black/50 px-3 py-1 rounded-full hover:bg-black/70"
        >
          Fechar ✕
        </button>
      </div>
      <div
        ref={scrollRef}
        className="flex flex-1 overflow-x-auto snap-x snap-mandatory"
        onClick={(e) => e.stopPropagation()}
      >
        {images.map((img) => (
          <div key={img.key} className="snap-center flex-shrink-0 min-w-full flex items-center justify-center px-6 pb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.src} alt={img.alt ?? ""} className="max-w-full max-h-full object-contain" />
          </div>
        ))}
      </div>
    </div>
  );
}
