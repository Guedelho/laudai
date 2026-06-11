"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import Link from "next/link";
import { focusRing } from "@/lib/ui";
import ImageLightbox from "@/components/ImageLightbox";
import { MAX_REPORT_IMAGES, MAX_IMAGE_FILE_SIZE, TABLES, REPORT_STATUSES, type ReportStatus } from "@/shared/constants";
import { uploadReportImages } from "@/lib/services/reports";
import { recordingToWav } from "@/lib/client/audio-wav";
import { Streamdown } from "streamdown";
import type { LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";
import { type Report } from "@/shared/models";
import { createClient } from "@/lib/supabase/client";
import { useReportEditor } from "@/lib/hooks/use-report-editor";
import { useDirectory } from "@/lib/hooks/use-directory";
import { useOrgReportsChannel } from "@/lib/hooks/use-org-reports-channel";
import {
  ReportEditorPatientFields,
  ReportEditorContent,
  ReportEditorActions,
} from "@/app/(auth)/report/[id]/ReportEditor";
import { SPECIALTIES } from "@/lib/report/templates";

function formatDuration(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function splitAtReport(messages: LaudoAgentUIMessage[]): {
  before: LaudoAgentUIMessage[];
  after: LaudoAgentUIMessage[];
  reportId: string | null;
} {
  for (let i = 0; i < messages.length; i++) {
    for (const p of messages[i].parts) {
      if (p.type === "tool-createReportDraft" && p.state === "output-available" && "reportId" in p.output) {
        return { before: messages.slice(0, i + 1), after: messages.slice(i + 1), reportId: p.output.reportId };
      }
    }
  }
  return { before: messages, after: [], reportId: null };
}

const START_LAUDO_MESSAGE = "Quero gerar um laudo de ultrassom abdominal.";

export default function InteractiveLaudoChat({
  greeting,
  orgId,
  initialMessages = [],
  autoStartLaudo = false,
}: {
  greeting: string;
  orgId: string;
  initialMessages?: LaudoAgentUIMessage[];
  autoStartLaudo?: boolean;
}) {
  const { messages, sendMessage, status } = useChat<LaudoAgentUIMessage>({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (!autoStartLaudo || autoStartedRef.current || messages.length > 0) return;
    autoStartedRef.current = true;
    sendMessage({ text: START_LAUDO_MESSAGE });
  }, [autoStartLaudo, messages.length, sendMessage]);
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioError, setAudioError] = useState("");
  const [imagesUploaded, setImagesUploaded] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [forcePanel, setForcePanel] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => clearInterval(timerRef.current ?? undefined), []);

  const { before, after, reportId } = splitAtReport(messages);
  const chatImages = collectChatImages(before);
  const busy = status === "submitted" || status === "streaming";
  const last = messages[messages.length - 1];
  const showThinking =
    busy && (!last || last.role !== "assistant" || !last.parts.some((p) => p.type === "text" && p.text.trim()));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, reportId, imagesUploaded]);

  const text = input.trim();
  const canSend = !busy && !recording && (text.length > 0 || attached.length > 0);

  async function send() {
    if (!canSend) return;
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
      sendMessage({ text });
    }
    setInput("");
    setAttached([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function startRecording() {
    setAudioError("");
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
          const ext = (raw.type.split("/")[1] || "webm").split(";")[0];
          setAttached((prev) => [...prev, new File([raw], `audio-${Date.now()}.${ext}`, { type: raw.type })]);
        }
      };
      rec.start();
      recorderRef.current = rec;
      setRecording(true);
      setRecordSeconds(0);
      timerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      setAudioError("Não foi possível acessar o microfone.");
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    recorderRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setRecording(false);
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-61px)] w-full max-w-3xl flex-col px-6 md:h-[100dvh]">
      <div className="shrink-0 pt-6 pb-3">
        <h1 className="text-lg font-semibold text-gray-900">Assistente IA</h1>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
        {initialMessages.length === 0 && (
          <div className="max-w-[85%] self-start rounded-2xl bg-gray-100 px-4 py-2 text-sm whitespace-pre-wrap text-gray-900">
            {greeting}
          </div>
        )}
        {before.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {showThinking && !imagesUploaded && <TypingDots />}
        {reportId && !imagesUploaded && !forcePanel && chatImages.length > 0 && (
          <AutoAttachImages
            reportId={reportId}
            images={chatImages}
            onDone={(files) => {
              setPreviewFiles(files);
              setImagesUploaded(true);
            }}
            onFallback={() => setForcePanel(true)}
          />
        )}
        {reportId && !imagesUploaded && (forcePanel || chatImages.length === 0) && (
          <ImageStep
            reportId={reportId}
            onDone={(files) => {
              setPreviewFiles(files);
              setImagesUploaded(true);
            }}
          />
        )}
        {reportId && imagesUploaded && (
          <ReportPreviewInChat reportId={reportId} orgId={orgId} previewFiles={previewFiles} />
        )}
        {after.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {showThinking && imagesUploaded && <TypingDots />}
        <div ref={endRef} />
      </div>

      {(!reportId || imagesUploaded) && (
        <div className="shrink-0 border-t border-gray-200 bg-gray-50 pt-3 pb-4">
          {recording && (
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-red-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              Gravando {formatDuration(recordSeconds)}
            </div>
          )}
          {audioError && <p className="mb-2 text-xs text-red-600">{audioError}</p>}
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
              aria-label="Anexar imagens"
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
              placeholder="Digite sua mensagem..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => (recording ? stopRecording() : startRecording())}
              disabled={busy}
              aria-label={recording ? "Parar gravação" : "Gravar áudio"}
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
              disabled={!canSend}
              className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
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
              className="max-w-[60%] shrink-0 self-end rounded-lg border border-gray-200"
            />
          );
        }
        if (part.type === "file" && part.mediaType?.startsWith("audio/")) {
          return <audio key={`${message.id}-${i}`} controls src={part.url} className="w-64 shrink-0 self-end" />;
        }
        return null;
      })}
    </>
  );
}

type ChatImage = { url: string; filename: string; mediaType: string };

function collectChatImages(messages: LaudoAgentUIMessage[]): ChatImage[] {
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

// The vet already attached the exam images in the chat (so the agent could read
// the measurements). Persist those same images to the report instead of asking
// for them again in the panel.
function AutoAttachImages({
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

function ImageStep({ reportId, onDone }: { reportId: string; onDone: (files: File[]) => void }) {
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
      onDone(files);
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
                aria-label="Remover imagem"
                className="absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:bg-red-600"
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
          onDelete={(i) => {
            removeFile(i);
            setLightboxIndex(null);
          }}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={uploading || files.length === 0}
        className={`w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
      >
        {uploading ? "Enviando imagens..." : "Enviar imagens"}
      </button>
    </div>
  );
}

function ReportPreviewInChat({
  reportId,
  orgId,
  previewFiles,
}: {
  reportId: string;
  orgId: string;
  previewFiles: File[];
}) {
  const [phase, setPhase] = useState<"waiting" | "completed" | "failed" | "error">("waiting");
  const [report, setReport] = useState<Report | null>(null);

  async function fetchAndResolve() {
    const supabase = createClient();
    const { data, error } = await supabase.from(TABLES.reports).select("*").eq("id", reportId).single();
    if (error) {
      setPhase("error");
      return;
    }
    if (data.status === REPORT_STATUSES.completed && data.edited_content) {
      setReport(data as Report);
      setPhase("completed");
    } else if (data.status === REPORT_STATUSES.failed) {
      setPhase("failed");
    }
  }

  // The hook subscribes first, then fires onSubscribed — so any completion that
  // landed before the channel went live is caught by the poll, and anything
  // after by onEvent. No race window.
  useOrgReportsChannel<{ id: string; status: ReportStatus }>(orgId, {
    onSubscribed: () => {
      fetchAndResolve().catch(() => setPhase("error"));
    },
    onEvent: (payload) => {
      if (payload.id !== reportId) return;
      if (payload.status === REPORT_STATUSES.completed) {
        fetchAndResolve().catch(() => setPhase("error"));
      } else if (payload.status === REPORT_STATUSES.failed) {
        setPhase("failed");
      }
    },
  });

  if (phase === "waiting") {
    return <TypingDots />;
  }

  if (phase === "failed" || phase === "error") {
    return (
      <div className="max-w-[85%] self-start rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900">
        {phase === "failed" ? "Falha ao gerar o laudo." : "Erro ao carregar o laudo."}{" "}
        <Link href={`/report/${reportId}`} className="underline hover:text-gray-700">
          Ver laudo →
        </Link>
      </div>
    );
  }

  if (!report) return null;

  return <ReportEditorInChat report={report} previewFiles={previewFiles} />;
}

function ReportEditorInChat({ report, previewFiles }: { report: Report; previewFiles: File[] }) {
  const editor = useReportEditor(report, () => {});
  const { pets, clients, breedSuggestions } = useDirectory();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const fileUrls = useMemo(() => previewFiles.map((f) => URL.createObjectURL(f)), [previewFiles]);
  useEffect(() => () => fileUrls.forEach(URL.revokeObjectURL), [fileUrls]);

  return (
    <div className="self-start w-full space-y-3 rounded-2xl bg-gray-100 px-4 py-3">
      <p className="text-sm font-medium text-gray-900">Laudo pronto. Revise e edite antes de confirmar:</p>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
        Gerado por IA — revise todas as informações com atenção antes de confirmar.
      </div>

      {editor.error && <p className="text-sm text-red-600">{editor.error}</p>}

      <ReportEditorPatientFields
        fields={editor.fields}
        setFields={editor.setFields}
        pets={pets}
        clients={clients}
        breedSuggestions={breedSuggestions}
        selectedClientId={editor.selectedClientId}
        selectPet={editor.selectPet}
        selectClient={editor.selectClient}
        selectVet={editor.selectVet}
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
            {SPECIALTIES[report.specialty].reportTitle}
          </h2>
        </div>
        <div className="p-4">
          <ReportEditorContent
            editedParsed={editor.editedParsed}
            setEditedParsed={editor.setEditedParsed}
            updateSection={editor.updateSection}
            removeSection={editor.removeSection}
            updateList={editor.updateList}
            addToList={editor.addToList}
            removeFromList={editor.removeFromList}
          />
        </div>
      </div>

      {fileUrls.length > 0 && (
        <div className="rounded-xl bg-white px-3 py-2.5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">Imagens do exame</p>
          <div className="grid grid-cols-3 gap-2">
            {fileUrls.map((url, i) => (
              <div key={url} className="cursor-pointer" onClick={() => setLightboxIndex(i)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={previewFiles[i]?.name ?? ""}
                  className="aspect-[4/3] w-full rounded-lg border border-gray-200 bg-black object-cover"
                />
              </div>
            ))}
          </div>
          {lightboxIndex !== null && (
            <ImageLightbox
              images={fileUrls.map((src) => ({ key: src, src }))}
              selectedIndex={lightboxIndex}
              onClose={() => setLightboxIndex(null)}
            />
          )}
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        <ReportEditorActions
          saving={editor.saving}
          printing={editor.printing}
          onSalvar={editor.handleSalvar}
          onImprimir={editor.handleImprimir}
        />
      </div>
    </div>
  );
}
