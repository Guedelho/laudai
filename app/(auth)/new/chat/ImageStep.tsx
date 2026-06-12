"use client";

import { useEffect, useRef, useState } from "react";
import { btnBlock } from "@/lib/ui";
import ImagePicker from "@/components/ImagePicker";
import { uploadReportImages } from "@/lib/services/reports";
import type { LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";

type ChatImage = { url: string; filename: string; mediaType: string };

export function collectChatImages(messages: LaudoAgentUIMessage[]): ChatImage[] {
  const out: ChatImage[] = [];
  for (const message of messages) {
    if (message.role !== "user") continue;
    for (const part of message.parts) {
      if (part.type === "file" && part.mediaType?.startsWith("image/")) {
        out.push({
          url: part.url,
          filename: part.filename ?? `imagem-${out.length + 1}.jpg`,
          mediaType: part.mediaType,
        });
      }
    }
  }
  return out;
}

export function AutoAttachImages({
  reportId,
  images,
  onDone,
  onFallback,
}: {
  reportId: string;
  images: ChatImage[];
  onDone: (files: File[]) => void;
  onFallback: () => void;
}) {
  const [error, setError] = useState("");
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const files = await Promise.all(
          images.map(async (img) => {
            const blob = await (await fetch(img.url)).blob();
            return new File([blob], img.filename, { type: img.mediaType || blob.type });
          }),
        );
        await uploadReportImages(reportId, files);
        onDone(files);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao anexar as imagens.");
      }
    })();
  }, [reportId, images, onDone]);

  if (error) {
    return (
      <div className="space-y-2 self-start rounded-2xl bg-gray-100 px-4 py-3 text-sm">
        <p className="text-red-600">{error}</p>
        <button type="button" onClick={onFallback} className="font-medium text-blue-600 hover:text-blue-700">
          Anexar imagens manualmente
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 self-start rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-600">
      <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
      Anexando as imagens do exame ao laudo...
    </div>
  );
}

export function ImageStep({ reportId, onDone }: { reportId: string; onDone: (files: File[]) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      await uploadReportImages(reportId, files);
      onDone(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagens.");
      setUploading(false);
    }
  }

  return (
    <ImagePicker
      title="Imagens do exame (obrigatório)"
      emptyText="Selecione ao menos uma imagem para continuar."
      onFilesChange={setFiles}
    >
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={handleSubmit} disabled={uploading || files.length === 0} className={btnBlock}>
        {uploading ? "Enviando imagens..." : "Enviar imagens"}
      </button>
    </ImagePicker>
  );
}
