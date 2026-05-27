"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isToolUIPart } from "ai";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";
import { MAX_REPORT_IMAGES, MAX_IMAGE_FILE_SIZE } from "@/shared/constants";
import { uploadReportImages } from "@/lib/services/reports";
import type { LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";

const TOOL_LABELS: Record<string, string> = {
  "tool-searchClients": "Buscando clientes...",
  "tool-createClient": "Cadastrando cliente...",
  "tool-addVet": "Cadastrando médico responsável...",
  "tool-searchPets": "Buscando pacientes...",
  "tool-createReportDraft": "Gerando laudo...",
};

export default function InteractiveLaudoChat({ greeting }: { greeting: string }) {
  const router = useRouter();

  // The greeting is rendered as a static bubble (below) rather than seeded into
  // useChat — Gemini requires the message history to start with a user turn, so
  // the first POST must not lead with an assistant message.
  const { messages, sendMessage, status } = useChat<LaudoAgentUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");

  // Once the draft is created, the conversation is done — reveal the (required)
  // image-upload step. reportId is read off the createReportDraft tool output.
  const reportId = useMemo(() => {
    for (const m of messages) {
      for (const p of m.parts) {
        if (p.type === "tool-createReportDraft" && p.state === "output-available" && "reportId" in p.output) {
          return p.output.reportId;
        }
      }
    }
    return null;
  }, [messages]);

  const busy = status === "submitted" || status === "streaming";

  return (
    <main className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 inline-block">
        ← Laudos
      </Link>

      <div className="flex flex-col gap-3">
        <div className="max-w-[85%] self-start rounded-2xl bg-gray-100 px-4 py-2 text-sm whitespace-pre-wrap text-gray-900">
          {greeting}
        </div>
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {busy && <p className="text-xs text-gray-400">Digitando...</p>}
      </div>

      {reportId ? (
        <ImageStep reportId={reportId} onDone={() => router.push(`/report/${reportId}?review=1`)} />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!input.trim() || busy) return;
            sendMessage({ text: input });
            setInput("");
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
            placeholder="Digite sua resposta..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enviar
          </button>
        </form>
      )}
    </main>
  );
}

function Message({ message }: { message: LaudoAgentUIMessage }) {
  const isUser = message.role === "user";
  return (
    <>
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          if (!part.text.trim()) return null;
          return (
            <div
              key={`${message.id}-${i}`}
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                isUser ? "self-end bg-blue-600 text-white" : "self-start bg-gray-100 text-gray-900"
              }`}
            >
              {part.text}
            </div>
          );
        }
        if (isToolUIPart(part) && part.state !== "output-available") {
          return (
            <p key={`${message.id}-${i}`} className="self-start text-xs text-gray-400 italic">
              {TOOL_LABELS[part.type] ?? "Processando..."}
            </p>
          );
        }
        return null;
      })}
    </>
  );
}

function ImageStep({ reportId, onDone }: { reportId: string; onDone: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);

  useEffect(() => {
    objectUrlsRef.current = objectUrls;
  }, [objectUrls]);
  useEffect(() => () => objectUrlsRef.current.forEach(URL.revokeObjectURL), []);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const selected = Array.from(e.target.files ?? []);
    if (inputRef.current) inputRef.current.value = "";
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
    setFiles((prev) => [...prev, ...capped]);
    setObjectUrls((prev) => [...prev, ...capped.map((f) => URL.createObjectURL(f))]);
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(objectUrls[index]);
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setObjectUrls((prev) => prev.filter((_, i) => i !== index));
    if (lightboxIndex === index) setLightboxIndex(null);
  }

  async function handleSubmit() {
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      await uploadReportImages(reportId, files);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar imagens.");
      setUploading(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          Imagens do exame (obrigatório)
          {files.length > 0 && <span className="ml-2 text-xs font-normal text-gray-500">{files.length}/50</span>}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={files.length >= MAX_REPORT_IMAGES}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Adicionar imagens
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleSelect} />
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {files.map((file, i) => (
            <div key={objectUrls[i]} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={objectUrls[i]}
                alt={file.name}
                onClick={() => setLightboxIndex(i)}
                className="w-full aspect-[4/3] object-cover rounded-lg border border-gray-200 bg-black cursor-pointer"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">Selecione ao menos uma imagem para continuar.</p>
      )}

      {lightboxIndex !== null && (
        <ImageLightbox
          images={objectUrls.map((url) => ({ key: url, src: url }))}
          selectedIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading || files.length === 0}
        className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {uploading ? "Enviando imagens..." : "Ver laudo"}
      </button>
    </div>
  );
}
