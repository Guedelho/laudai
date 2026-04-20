"use client";

import { ParsedReport } from "@/shared/models";

function BulletList({ title, items, className }: { title: string; items: string[]; className?: string }) {
  return (
    <div className={className}>
      <h4 className="font-semibold text-gray-900 text-sm mb-2">{title}</h4>
      <ul className="space-y-1.5 ml-1">
        {items.map((line, i) => (
          <li key={i} className="flex gap-2 text-justify">
            <span className="text-gray-400 shrink-0">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ReportContent({ parsedReport }: { parsedReport: ParsedReport }) {
  return (
    <div className="text-sm text-gray-800 leading-relaxed space-y-2">
      {parsedReport.sections.map((section, i) => (
        <div key={i} className="text-justify">
          <span className="font-semibold text-gray-900">{section.label}:</span>
          {section.content ? " " + section.content : ""}
        </div>
      ))}

      {(parsedReport.conclusion || parsedReport.impression?.length) && (
        <div className="border-t border-gray-100 pt-4 mt-4">
          <h3 className="font-bold text-gray-900 text-sm mb-3">CONCLUSÃO</h3>
        </div>
      )}

      {parsedReport.conclusion && !parsedReport.impression?.length && (
        <p className="text-justify">{parsedReport.conclusion}</p>
      )}

      {parsedReport.impression?.length ? (
        <BulletList title="IMPRESSÃO DIAGNÓSTICA:" items={parsedReport.impression} />
      ) : null}

      {parsedReport.recommendations?.length ? (
        <BulletList title="RECOMENDAÇÕES:" items={parsedReport.recommendations} className="mt-3" />
      ) : null}

      {parsedReport.observations?.length ? (
        <div className="mt-3">
          <h4 className="font-semibold text-gray-900 text-sm mb-2">OBS:</h4>
          {parsedReport.observations.map((line, i) => (
            <p key={i} className="mb-1 text-justify">
              {line}
            </p>
          ))}
        </div>
      ) : null}

      {!parsedReport.sections.length && parsedReport.raw && (
        <div className="whitespace-pre-wrap">{parsedReport.raw}</div>
      )}
    </div>
  );
}
