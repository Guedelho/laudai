"use client";

import { useEffect, useRef } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { useIsClient } from "@/lib/use-is-client";

export function useDictation(setText: (value: string) => void) {
  const anchorRef = useRef("");
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition, isMicrophoneAvailable } =
    useSpeechRecognition();
  const isClient = useIsClient();
  const supported = !isClient || browserSupportsSpeechRecognition;
  const micPermissionError =
    isClient && !isMicrophoneAvailable
      ? "Permissão para microfone negada. Habilite o microfone nas configurações do navegador."
      : "";

  useEffect(() => {
    if (!listening && !transcript) return;
    const anchor = anchorRef.current;
    const live = transcript.trim();
    setText(anchor + (anchor && live ? " " : "") + live);
  }, [transcript, listening, setText]);

  async function start(currentText: string, onError?: (message: string) => void) {
    if (!browserSupportsSpeechRecognition) {
      onError?.("Seu navegador não suporta reconhecimento de voz. Use Chrome, Edge ou Safari.");
      return;
    }
    anchorRef.current = currentText;
    resetTranscript();
    try {
      await SpeechRecognition.startListening({ language: "pt-BR", continuous: true });
    } catch {
      onError?.("Não foi possível acessar o microfone.");
    }
  }

  async function stop() {
    await SpeechRecognition.stopListening();
  }

  function reset() {
    resetTranscript();
    anchorRef.current = "";
  }

  return { listening, supported, micPermissionError, start, stop, reset };
}
