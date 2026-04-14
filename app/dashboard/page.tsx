import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Specialty } from "@/types";
import AppHeader from "@/components/AppHeader";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdmin();
  const { data: laudos } = await admin
    .from("laudos")
    .select("id, patient_name, owner_name, specialty, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader current="/dashboard" />

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Laudos Recentes</h2>

        {!laudos?.length && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">Nenhum laudo gerado ainda</p>
            <Link href="/new" className="text-blue-600 text-sm hover:underline">
              Gerar primeiro laudo
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {laudos?.map((laudo: { id: string; patient_name: string; owner_name: string; specialty: Specialty; created_at: string; updated_at?: string }) => (
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
      </main>
    </div>
  );
}
