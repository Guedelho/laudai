"use client";

import { ParsedLaudo } from "@/types";

export default function LaudoContent({ parsedLaudo }: { parsedLaudo: ParsedLaudo }) {
  return (
    <div className="font-mono text-sm text-gray-800 leading-relaxed">
      {parsedLaudo.sections.map((section, i) => (
        <div key={i} className="mb-2 text-justify">
          <span className="font-bold">{section.label}:</span>
          {section.content ? " " + section.content : ""}
        </div>
      ))}

      {(parsedLaudo.conclusion || parsedLaudo.impressao?.length) && (
        <div className="mt-4 mb-2 font-bold underline text-sm">CONCLUSÃO</div>
      )}

      {parsedLaudo.conclusion && !parsedLaudo.impressao?.length && (
        <div className="mb-2 text-justify">{parsedLaudo.conclusion}</div>
      )}

      {parsedLaudo.impressao?.length ? (
        <>
          <div className="font-bold text-sm mt-2 mb-1">IMPRESSÃO DIAGNÓSTICA:</div>
          {parsedLaudo.impressao.map((line, i) => (
            <div key={i} className="mb-1 text-justify">{line}</div>
          ))}
        </>
      ) : null}

      {parsedLaudo.recomendacoes?.length ? (
        <>
          <div className="font-bold text-sm mt-3 mb-1">RECOMENDAÇÕES:</div>
          {parsedLaudo.recomendacoes.map((line, i) => (
            <div key={i} className="mb-1 text-justify">• {line}</div>
          ))}
        </>
      ) : null}

      {/* Fallback for old plain-text records */}
      {!parsedLaudo.sections.length && parsedLaudo.raw && (
        <div className="whitespace-pre-wrap">{parsedLaudo.raw}</div>
      )}
    </div>
  );
}
