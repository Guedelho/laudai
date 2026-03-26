import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Laudo } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: laudos } = await supabase
    .from("laudos")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Laudai</h1>
        <Link
          href="/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Novo Laudo
        </Link>
      </header>

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
          {laudos?.map((laudo: Laudo) => (
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
                  {new Date(laudo.created_at).toLocaleDateString("pt-BR")}
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
