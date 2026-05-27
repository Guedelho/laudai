"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import Link from "next/link";
import ImageLightbox from "@/components/ImageLightbox";
import { MAX_REPORT_IMAGES, MAX_IMAGE_FILE_SIZE, TABLES } from "@/shared/constants";
import { uploadReportImages } from "@/lib/services/reports";
import { recordingToWav } from "@/lib/audio-wav";
import { Streamdown } from "streamdown";
import type { LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";
import { REPORT_STATUSES, type Report, type ReportStatus, type ParsedReport } from "@/shared/models";
import { parseReportContent, sexLabel, splitBoldSegments } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { openReportPdfTab } from "@/lib/pdf-tab";

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

export default function InteractiveLaudoChat({ greeting, orgId }: { greeting: string; orgId: string }) {
  const { messages, sendMessage, status, setMessages } = useChat<LaudoAgentUIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioError, setAudioError] = useState("");
  const [imagesUploaded, setImagesUploaded] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => clearInterval(timerRef.current ?? undefined), []);

  const reportId = findReportId(messages);
  const busy = status === "submitted" || status === "streaming";
  const last = messages[messages.length - 1];
  const showThinking =
    busy && (!last || last.role !== "assistant" || !last.parts.some((p) => p.type === "text" && p.text.trim()));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, reportId, imagesUploaded]);

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

  function resetChat() {
    if (recording) stopRecording();
    setMessages([]);
    setInput("");
    setAttached([]);
    setAudioError("");
    setImagesUploaded(false);
  }

  return (
    <main className="mx-auto flex h-[calc(100dvh-64px)] w-full max-w-2xl flex-col px-6">
      <div className="flex shrink-0 items-center justify-between pt-4 pb-2">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          ← Laudos
        </Link>
        {messages.length > 0 && (
          <button type="button" onClick={resetChat} className="text-sm text-blue-600 hover:text-blue-700">
            Novo laudo
          </button>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4">
        <div className="max-w-[85%] self-start rounded-2xl bg-gray-100 px-4 py-2 text-sm whitespace-pre-wrap text-gray-900">
          {greeting}
        </div>
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}
        {showThinking && <TypingDots />}
        {reportId && !imagesUploaded && <ImageStep reportId={reportId} onDone={() => setImagesUploaded(true)} />}
        {reportId && imagesUploaded && <ReportPreviewInChat reportId={reportId} orgId={orgId} />}
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
              {isUser ? (
                <span className="whitespace-pre-wrap">{part.text}</span>
              ) : (
                <Streamdown parseIncompleteMarkdown={false}>{part.text}</Streamdown>
              )}
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
        {uploading ? "Enviando imagens..." : "Enviar imagens"}
      </button>
    </div>
  );
}

function RichText({ text }: { text: string }) {
  return (
    <>
      {splitBoldSegments(text).map((seg, i) =>
        seg.bold ? (
          <strong key={i} className="font-semibold text-gray-900">
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function ReportPreviewContent({ parsedReport }: { parsedReport: ParsedReport }) {
  return (
    <div className="text-sm text-gray-800 leading-relaxed space-y-2">
      {parsedReport.sections.map((section, i) => (
        <div key={i} className="text-justify">
          <span className="font-semibold text-gray-900">{section.label}:</span> <RichText text={section.content} />
        </div>
      ))}

      {(parsedReport.conclusion || parsedReport.impression?.length) && (
        <div className="border-t border-gray-100 pt-3 mt-3">
          <p className="font-bold text-gray-900 text-sm mb-2">CONCLUSÃO</p>
        </div>
      )}

      {parsedReport.conclusion && !parsedReport.impression?.length && (
        <p className="text-justify">
          <RichText text={parsedReport.conclusion} />
        </p>
      )}

      {parsedReport.impression?.length ? (
        <div>
          <p className="font-semibold text-sm mb-1">IMPRESSÃO DIAGNÓSTICA:</p>
          <ul className="space-y-1.5 ml-1">
            {parsedReport.impression.map((line, i) => (
              <li key={i} className="flex gap-2 text-justify">
                <span className="text-gray-500 shrink-0">•</span>
                <span>
                  <RichText text={line} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {parsedReport.recommendations?.length ? (
        <div className="mt-2">
          <p className="font-semibold text-sm mb-1">RECOMENDAÇÕES:</p>
          <ul className="space-y-1.5 ml-1">
            {parsedReport.recommendations.map((line, i) => (
              <li key={i} className="flex gap-2 text-justify">
                <span className="text-gray-500 shrink-0">•</span>
                <span>
                  <RichText text={line} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {parsedReport.observations?.length ? (
        <div className="mt-2">
          <p className="font-semibold text-sm mb-1">OBS:</p>
          {parsedReport.observations.map((line, i) => (
            <p key={i} className="mb-1 text-justify">
              <RichText text={line} />
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ReportPreviewInChat({ reportId, orgId }: { reportId: string; orgId: string }) {
  const [phase, setPhase] = useState<"waiting" | "completed" | "failed" | "error">("waiting");
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function fetchAndResolve() {
      const { data, error } = await supabase.from(TABLES.reports).select("*").eq("id", reportId).single();
      if (cancelled) return;
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

    async function init() {
      await supabase.realtime.setAuth();
      if (cancelled) return;

      // Subscribe first, then poll — eliminates the race window between a status
      // check and the channel becoming active.
      await new Promise<void>((resolve) => {
        channel = supabase
          .channel(`org:${orgId}:reports`, { config: { private: true } })
          .on<{ id: string; status: ReportStatus }>("broadcast", { event: "report_changed" }, async ({ payload }) => {
            if (payload.id !== reportId) return;
            if (payload.status === REPORT_STATUSES.completed) {
              await fetchAndResolve();
            } else if (payload.status === REPORT_STATUSES.failed) {
              if (!cancelled) setPhase("failed");
            }
          })
          .subscribe((s) => {
            if (s === "SUBSCRIBED") resolve();
          });
      });

      // Now that the channel is live, check current status — any completion
      // that happened before subscribe will be caught here; anything after is
      // caught by the broadcast handler.
      await fetchAndResolve();
    }

    init().catch(() => {
      if (!cancelled) setPhase("error");
    });

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [reportId, orgId]);

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

  if (!report?.edited_content) return null;

  let parsedReport: ParsedReport;
  try {
    parsedReport = parseReportContent(report.edited_content);
  } catch {
    return null;
  }

  const displayDate = new Date(report.exam_date + "T12:00:00").toLocaleDateString("pt-BR");

  return (
    <div className="max-w-[90%] self-start space-y-3 rounded-2xl bg-gray-100 px-4 py-3 text-sm text-gray-900">
      <p className="font-medium">Laudo pronto. Revise antes de confirmar:</p>

      <div className="grid grid-cols-2 gap-x-4 rounded-xl bg-white px-3 py-2.5 text-xs text-gray-700">
        <div className="space-y-0.5">
          <p className="mb-1 font-semibold uppercase tracking-wide text-gray-400">Paciente</p>
          <p className="font-medium text-gray-900">{report.patient_name}</p>
          <p>
            {report.species} · {report.breed}
          </p>
          <p>
            {report.age} · {sexLabel(report.sex)} · {report.neutered ? "Castrado(a)" : "Não castrado(a)"}
          </p>
          <p>Tutor: {report.owner_name}</p>
        </div>
        <div className="space-y-0.5">
          <p className="mb-1 font-semibold uppercase tracking-wide text-gray-400">Atendimento</p>
          <p className="font-medium text-gray-900">{report.client_name}</p>
          <p>{report.responsible_vet}</p>
          <p>{displayDate}</p>
        </div>
      </div>

      <div className="rounded-xl bg-white px-3 py-2.5">
        <ReportPreviewContent parsedReport={parsedReport} />
      </div>

      <p className="text-xs text-gray-400">Gerado por IA — revise antes de confirmar.</p>

      <div className="flex items-center justify-between gap-2">
        <Link href={`/report/${reportId}`} className="text-xs text-gray-500 underline hover:text-gray-700">
          Editar laudo
        </Link>
        <button
          type="button"
          onClick={() => openReportPdfTab(reportId)}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
        >
          Confirmar e gerar PDF
        </button>
      </div>
    </div>
  );
}
