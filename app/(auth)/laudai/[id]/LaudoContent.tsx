"use client";

import { ParsedLaudo } from "@/shared";

export default function LaudoContent({ parsedLaudo }: { parsedLaudo: ParsedLaudo }) {
  return (
    <div className="text-sm text-gray-800 leading-relaxed space-y-2">
      {parsedLaudo.sections.map((section, i) => (
        <div key={i} className="text-justify">
          <span className="font-semibold text-gray-900">{section.label}:</span>
          {section.content ? " " + section.content : ""}
        </div>
      ))}

      {(parsedLaudo.conclusion || parsedLaudo.impressao?.length) && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">CONCLUSÃO</h3>
        </div>
      )}

      {parsedLaudo.conclusion && !parsedLaudo.impressao?.length && (
        <p className="text-justify">{parsedLaudo.conclusion}</p>
      )}

      {parsedLaudo.impressao?.length ? (
        <div>
          <h4 className="font-semibold text-gray-900 text-sm mb-2">IMPRESSÃO DIAGNÓSTICA:</h4>
          <ul className="space-y-1.5 ml-1">
            {parsedLaudo.impressao.map((line, i) => (
              <li key={i} className="flex gap-2 text-justify">
                <span className="text-gray-400 shrink-0">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {parsedLaudo.recomendacoes?.length ? (
        <div className="mt-3">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">RECOMENDAÇÕES:</h4>
          <ul className="space-y-1.5 ml-1">
            {parsedLaudo.recomendacoes.map((line, i) => (
              <li key={i} className="flex gap-2 text-justify">
                <span className="text-gray-400 shrink-0">•</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {parsedLaudo.observacoes?.length ? (
        <div className="mt-3">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">OBS:</h4>
          {parsedLaudo.observacoes.map((line, i) => (
            <p key={i} className="mb-1 text-justify">
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {!parsedLaudo.sections.length && parsedLaudo.raw && <div className="whitespace-pre-wrap">{parsedLaudo.raw}</div>}
    </div>
  );
}
