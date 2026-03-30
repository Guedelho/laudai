import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Laudo } from "@/types";
import PrintButton from "./PrintButton";
import EditRawInput from "./EditRawInput";

export default async function LaudoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: laudo } = await supabase
    .from("laudos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!laudo) notFound();

  const l = laudo as Laudo;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Voltar
          </Link>
          <h1 className="text-lg font-bold text-gray-900 mt-1">{l.patient_name}</h1>
          <p className="text-sm text-gray-500">{SPECIALTY_LABELS[l.specialty]}</p>
        </div>
        <PrintButton />
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8">
          <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
            {l.generated_content}
          </pre>
        </div>
        <EditRawInput laudoId={l.id} initialRawInput={l.raw_input} />
      </main>
    </div>
  );
}
