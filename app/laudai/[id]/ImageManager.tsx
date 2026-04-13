import Image from "next/image";
import { LaudoImage } from "@/types";

export default function ImageManager({ initialImages }: { initialImages: LaudoImage[] }) {
  if (!initialImages.length) return null;

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-gray-700 mb-3">Imagens do exame</p>
      <div className="grid grid-cols-2 gap-4">
        {initialImages.map((img) => (
          <Image
            key={img.id}
            src={img.url}
            alt={img.file_name}
            width={600}
            height={400}
            sizes="(max-width: 768px) 100vw, 50vw"
            className="w-full rounded-lg border border-gray-200 object-contain bg-black"
          />
        ))}
      </div>
    </div>
  );
}
