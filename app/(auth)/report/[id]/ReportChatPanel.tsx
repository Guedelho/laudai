"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Streamdown } from "streamdown";
import { parseReportContent } from "@/lib/utils";
import type { Report } from "@/shared/models";

export default function ReportChatPanel({
  report,
  open,
  onClose,
}: {
  report: Report;
  open: boolean;
  onClose: () => void;
}) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const reportBody = useMemo(() => {
    let content;
    try {
      content = parseReportContent(report.edited_content!);
    } catch {
      content = { sections: [] };
    }
    return {
      patientName: report.patient_name,
      species: report.species,
      breed: report.breed,
      age: report.age,
      sex: report.sex,
      neutered: report.neutered,
      ownerName: report.owner_name,
      clientName: report.client_name,
      responsibleVet: report.responsible_vet,
      examDate: report.exam_date,
      content,
    };
  }, [report]);

  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/laudo-chat", body: { report: reportBody } }),
    [reportBody],
  );

  const { messages, sendMessage, status } = useChat({ transport });
  const busy = status === "streaming" || status === "submitted";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 z-50 flex w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Assistente do laudo</p>
            <p className="text-xs text-gray-400">{report.patient_name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar painel"
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="mt-6 space-y-2 text-center">
              <p className="text-2xl">🔬</p>
              <p className="text-sm font-medium text-gray-700">Tire dúvidas sobre o laudo</p>
              <p className="text-xs text-gray-400">
                Pergunte sobre achados, diagnósticos diferenciais, termos médicos ou recomendações.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                message.role === "user" ? "self-end bg-blue-600 text-white" : "self-start bg-gray-100 text-gray-900"
              }`}
            >
              {message.parts.map((part, i) =>
                part.type === "text" ? (
                  message.role === "user" ? (
                    <span key={i} className="whitespace-pre-wrap">
                      {part.text}
                    </span>
                  ) : (
                    <Streamdown key={i} parseIncompleteMarkdown={false}>
                      {part.text}
                    </Streamdown>
                  )
                ) : null,
              )}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-1 self-start rounded-2xl bg-gray-100 px-3 py-2.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="shrink-0 border-t border-gray-200 p-3">
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
              placeholder="Pergunte sobre o laudo..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
              autoFocus
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              aria-label="Enviar pergunta"
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              →
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
