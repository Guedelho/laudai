"use client";

import { useState } from "react";
import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Specialty } from "@/types";

interface LaudoSummary {
  id: string;
  patient_name: string;
  owner_name: string;
  specialty: Specialty;
  created_at: string;
  exam_date?: string;
}

export default function LaudoList({ laudos }: { laudos: LaudoSummary[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? laudos.filter(
        (l) =>
          l.patient_name.toLowerCase().includes(query.toLowerCase()) ||
          l.owner_name.toLowerCase().includes(query.toLowerCase()),
      )
    : laudos;

  return (
    <div className="space-y-4">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por paciente ou responsável..."
        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />

      {!laudos.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Nenhum laudo gerado ainda</p>
          <Link href="/new" className="text-blue-600 text-sm hover:underline">
            Gerar primeiro laudo
          </Link>
        </div>
      ) : !filtered.length ? (
        <div className="text-center py-16 text-gray-400">
          <p>Nenhum resultado para &ldquo;{query}&rdquo;</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((laudo) => (
            <div
              key={laudo.id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <p className="font-medium text-gray-900">{laudo.patient_name}</p>
                <p className="text-sm text-gray-500">
                  {SPECIALTY_LABELS[laudo.specialty]} · {laudo.owner_name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Criado: {new Date(laudo.created_at).toLocaleDateString("pt-BR")}
                  {laudo.exam_date && (
                    <> · Exame: {new Date(laudo.exam_date + "T12:00:00").toLocaleDateString("pt-BR")}</>
                  )}
                </p>
              </div>
              <Link href={`/laudai/${laudo.id}`} className="text-sm text-blue-600 hover:underline">
                Ver laudo
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
