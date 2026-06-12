"use client";

import { Streamdown } from "streamdown";
import type { LaudoAgentUIMessage } from "@/lib/agents/laudo-agent";

export function Message({ message }: { message: LaudoAgentUIMessage }) {
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

export function TypingDots() {
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

export function SessionDivider({ date, label }: { date?: string; label?: string }) {
  const text =
    label ??
    new Date(date!).toLocaleString("pt-BR", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="h-px flex-1 bg-gray-200" />
      <span className="text-xs text-gray-400">{text}</span>
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
