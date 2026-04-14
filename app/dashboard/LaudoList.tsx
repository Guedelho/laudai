import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Specialty } from "@/types";

interface LaudoSummary {
  id: string;
  patient_name: string;
  owner_name: string;
  specialty: Specialty;
  created_at: string;
  updated_at?: string;
}

export default function LaudoList({ laudos }: { laudos: LaudoSummary[] }) {
  if (!laudos.length) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg mb-2">Nenhum laudo gerado ainda</p>
        <Link href="/new" className="text-blue-600 text-sm hover:underline">
          Gerar primeiro laudo
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {laudos.map((laudo) => (
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
              {laudo.updated_at && (
                <> · Editado: {new Date(laudo.updated_at).toLocaleDateString("pt-BR")}</>
              )}
            </p>
          </div>
          <Link
            href={`/laudai/${laudo.id}`}
            className="text-sm text-blue-600 hover:underline"
          >
            Ver laudo
          </Link>
        </div>
      ))}
    </div>
  );
}
