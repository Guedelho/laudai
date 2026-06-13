"use client";

import { Fragment, useState, useRef, useEffect, useLayoutEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart } from "ai";
import { focusRing, btnPrimary, btnSecondary, btnIcon } from "@/lib/ui";
import { CHAT_HISTORY_PAGE_SIZE, CHAT_SESSION_GAP_MS } from "@/shared/constants";
import { fetchChatHistory } from "@/lib/services/chat";
import { trackEvent } from "@/lib/client/analytics";
import { recordingToWav } from "@/lib/client/audio-wav";
import type { LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";
import { type ChatHistoryMessage } from "@/shared/models";
import { Message, TypingDots, SessionDivider } from "./ChatMessage";
import { AutoAttachImages, ImageStep, collectChatImages } from "./ImageStep";
import { ReportPreviewInChat } from "./ReportPreviewInChat";

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

function historyToUIMessage(m: ChatHistoryMessage): LaudoAgentUIMessage {
  return { id: m.id, role: m.role, parts: m.parts };
}

function splitAtReport(messages: LaudoAgentUIMessage[]): {
  before: LaudoAgentUIMessage[];
  after: LaudoAgentUIMessage[];
  reportId: string | null;
} {
  for (let i = 0; i < messages.length; i++) {
    for (const p of messages[i].parts) {
      if (
        p.type === "tool-createReportDraft" &&
        p.state === "output-available" &&
        "reportId" in p.output &&
        typeof p.output.reportId === "string"
      ) {
        return { before: messages.slice(0, i + 1), after: messages.slice(i + 1), reportId: p.output.reportId };
      }
    }
  }
  return { before: messages, after: [], reportId: null };
}

const STICK_TO_BOTTOM_THRESHOLD_PX = 100;

function isSessionStart(prev: ChatHistoryMessage | undefined, current: ChatHistoryMessage, hasMore: boolean): boolean {
  if (!prev) return !hasMore;
  return new Date(current.created_at).getTime() - new Date(prev.created_at).getTime() > CHAT_SESSION_GAP_MS;
}

export default function InteractiveLaudoChat({
  greeting,
  orgId,
  initialMessages,
  historyCursor,
  hasHistory,
  autoStartMessage,
}: {
  greeting: string;
  orgId: string;
  initialMessages: LaudoAgentUIMessage[];
  historyCursor: number | null;
  hasHistory: boolean;
  autoStartMessage: string | null;
}) {
  const { messages, sendMessage, status, error, stop, regenerate } = useChat<LaudoAgentUIMessage>({
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const autoStartedRef = useRef(false);

  useEffect(() => {
    if (!autoStartMessage || autoStartedRef.current || messages.length > 0) return;
    autoStartedRef.current = true;
    sendMessage({ text: autoStartMessage });
    window.history.replaceState(null, "", "/new/chat");
  }, [autoStartMessage, messages.length, sendMessage]);
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState<File[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [audioError, setAudioError] = useState("");
  const [imagesUploaded, setImagesUploaded] = useState(false);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [forcePanel, setForcePanel] = useState(false);
  const [history, setHistory] = useState<ChatHistoryMessage[]>([]);
  const [cursor, setCursor] = useState(historyCursor);
  const [hasMore, setHasMore] = useState(hasHistory);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const prevScrollHeightRef = useRef(0);
  const adjustScrollRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const trackedLaudoRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => clearInterval(timerRef.current ?? undefined), []);

  useLayoutEffect(() => {
    if (!adjustScrollRef.current) return;
    adjustScrollRef.current = false;
    const el = scrollRef.current;
    if (el) el.scrollTop += el.scrollHeight - prevScrollHeightRef.current;
  }, [history]);

  async function loadOlder() {
    if (loadingHistory) return;
    setLoadingHistory(true);
    setHistoryError("");
    try {
      const older = await fetchChatHistory(cursor);
      if (older.length < CHAT_HISTORY_PAGE_SIZE) setHasMore(false);
      if (older.length) {
        prevScrollHeightRef.current = scrollRef.current?.scrollHeight ?? 0;
        adjustScrollRef.current = true;
        setCursor(older[0].seq);
        setHistory((prev) => [...older, ...prev]);
      }
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Erro ao carregar o histórico.");
    } finally {
      setLoadingHistory(false);
    }
  }

  const { before, after, reportId } = splitAtReport(messages);
  const chatImages = collectChatImages(before);
  const busy = status === "submitted" || status === "streaming";
  const last = messages[messages.length - 1];
  const showThinking =
    busy && (!last || last.role !== "assistant" || !last.parts.some((p) => p.type === "text" && p.text.trim()));

  useEffect(() => {
    if (!reportId || trackedLaudoRef.current) return;
    trackedLaudoRef.current = true;
    trackEvent({ event: "generate_laudo", method: "chat" });
  }, [reportId]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_TO_BOTTOM_THRESHOLD_PX;
  }

  useEffect(() => {
    if (stickToBottomRef.current) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy, reportId, imagesUploaded, error]);

  const text = input.trim();
  const canSend = !busy && !recording && (text.length > 0 || attached.length > 0);

  async function send() {
    if (!canSend) return;
    stickToBottomRef.current = true;
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
        <h1 className="text-lg font-semibold text-gray-900">Assistente</h1>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        role="log"
        aria-label="Conversa"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-4"
      >
        {hasMore && (
          <button
            type="button"
            onClick={loadOlder}
            disabled={loadingHistory}
            className={`self-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 ${focusRing}`}
          >
            {loadingHistory ? "Carregando..." : "Ver conversas anteriores"}
          </button>
        )}
        {historyError && <p className="self-center text-xs text-red-600">{historyError}</p>}
        {history.map((m, i) => (
          <Fragment key={m.id}>
            {isSessionStart(history[i - 1], m, hasMore) && <SessionDivider date={m.created_at} />}
            <Message message={historyToUIMessage(m)} />
          </Fragment>
        ))}
        {history.length > 0 && <SessionDivider label="Conversa atual" />}
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
        {error && !busy && (
          <div className="max-w-[85%] space-y-1 self-start rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            <p>Não foi possível obter a resposta.</p>
            <button
              type="button"
              onClick={() => regenerate()}
              className={`rounded font-medium underline hover:text-red-800 ${focusRing}`}
            >
              Tentar novamente
            </button>
          </div>
        )}
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
              className={btnIcon}
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
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Digite sua mensagem..."
              aria-label="Mensagem"
              className="max-h-40 flex-1 resize-none field-sizing-content rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => (recording ? stopRecording() : startRecording())}
              disabled={busy}
              aria-label={recording ? "Parar gravação" : "Gravar áudio"}
              title={recording ? "Parar gravação" : "Gravar áudio"}
              className={
                recording
                  ? `rounded-lg border border-red-500 bg-red-500 px-3 py-2 text-sm text-white transition-colors hover:bg-red-600 ${focusRing}`
                  : btnIcon
              }
            >
              {recording ? "⏹" : "🎤"}
            </button>
            {busy ? (
              <button type="button" onClick={() => stop()} className={btnSecondary}>
                Parar
              </button>
            ) : (
              <button type="submit" disabled={!canSend} className={btnPrimary}>
                Enviar
              </button>
            )}
          </form>
        </div>
      )}
    </main>
  );
}
