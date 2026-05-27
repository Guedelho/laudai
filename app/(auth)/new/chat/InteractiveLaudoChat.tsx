"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";
import { MAX_REPORT_IMAGES, MAX_IMAGE_FILE_SIZE } from "@/shared/constants";
import { uploadReportImages } from "@/lib/services/reports";
import { recordingToWav } from "@/lib/audio-wav";
import { Streamdown } from "streamdown";
import type { LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function findReportId(messages: LaudoAgentUIMessage[]): string | null {
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type === "tool-createReportDraft" && p.state === "output-available" && "reportId" in p.output) {
        return p.output.reportId;
      }
    }
  }
  return null;
}

export default function InteractiveLaudoChat({ greeting }: { greeting: string }) {
  const router = useRouter();

  // The greeting is rendered as a static bubble (below) rather than seeded into
  // useChat — Gemini requires the message history to start with a user turn, so
  // the first POST must not lead with an assistant message.
  const { messages, sendMessage, status } = useChat<LaudoAgentUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const reportId = findReportId(messages);
  const busy = status === "submitted" || status === "streaming";
  const last = messages[messages.length - 1];
  const showThinking =
    busy && (!last || last.role !== "assistant" || !last.parts.some((p) => p.type === "text" && p.text.trim()));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, reportId]);

  async function send() {
    if (busy || recording) return;
    const text = input.trim();
    if (attached.length > 0) {
      const files: FileUIPart[] = await Promise.all(
        attached.map(async (f) => ({
          type: "file" as const,
          mediaType: f.type,
          filename: f.name,
          url: await fileToDataUrl(f),
        })),
      );
      sendMessage({ text, files });
    } else {
      sendMessage({ text: text || "Pode seguir." });
    }
    setInput("");
    setAttached([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const raw = new Blob(chunksRef.current, { type: rec.mimeType || "audio/webm" });
        try {
          const wav = await recordingToWav(raw);
          setAttached((prev) => [...prev, new File([wav], `audio-${Date.now()}.wav`, { type: "audio/wav" })]);
        } catch {
          /* could not process the recording */
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
    } catch {
      /* mic permission denied */
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setRecording(false);
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-64px)] w-full max-w-2xl flex-col px-6">
      <div className="shrink-0 pt-4 pb-2">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Laudos
        </Link>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
        <div className="max-w-[85%] self-start rounded-2xl bg-gray-100 px-4 py-2 text-sm whitespace-pre-wrap text-gray-900">
          {greeting}
        </div>
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {showThinking && <TypingDots />}
        {reportId && <ImageStep reportId={reportId} onDone={() => router.push(`/report/${reportId}?review=1`)} />}
        <div ref={endRef} />
      </div>

      {!reportId && (
        <div className="shrink-0 border-t border-gray-200 bg-gray-50 pt-3 pb-4">
          {attached.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attached.map((f, i) => (
                <span
                  key={`${f.name}-${i}`}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700"
                >
                  {f.type.startsWith("audio/") ? "🎙️ Áudio" : f.name}
                  <button
                    type="button"
                    onClick={() => setAttached((prev) => prev.filter((_, j) => j !== i))}
                    className="text-blue-400 hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex gap-2"
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={busy}
              title="Anexar imagens para perguntar"
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
            >
              📎
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                setAttached((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
              }}
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder="Digite sua resposta (ou Enter para seguir)..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => (recording ? stopRecording() : startRecording())}
              disabled={busy}
              title={recording ? "Parar gravação" : "Gravar áudio"}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                recording
                  ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
                  : "border-gray-300 bg-white text-gray-600 hover:border-blue-400 hover:text-blue-600"
              }`}
            >
              {recording ? "⏹" : "🎤"}
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </main>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 self-start rounded-2xl bg-gray-100 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
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
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                isUser ? "self-end bg-blue-600 text-white" : "self-start bg-gray-100 text-gray-900"
              }`}
            >
              {isUser ? <span className="whitespace-pre-wrap">{part.text}</span> : <Streamdown>{part.text}</Streamdown>}
            </div>
          );
        }
        if (part.type === "file" && part.mediaType?.startsWith("image/")) {
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${message.id}-${i}`}
              src={part.url}
              alt={part.filename ?? ""}
              className="max-w-[60%] self-end rounded-lg border border-gray-200"
            />
          );
        }
        if (part.type === "file" && part.mediaType?.startsWith("audio/")) {
          return <audio key={`${message.id}-${i}`} controls src={part.url} className="max-w-[70%] self-end" />;
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
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          Imagens do exame (obrigatório)
          {files.length > 0 && <span className="ml-2 text-xs font-normal text-gray-500">{files.length}/50</span>}
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
            <div key={objectUrls[i]} className="group relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={objectUrls[i]}
                alt={file.name}
                onClick={() => setLightboxIndex(i)}
                className="aspect-[4/3] w-full cursor-pointer rounded-lg border border-gray-200 bg-black object-cover"
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
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
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? "Enviando imagens..." : "Ver laudo"}
      </button>
    </div>
  );
}
