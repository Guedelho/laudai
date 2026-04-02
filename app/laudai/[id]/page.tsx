import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { SPECIALTY_LABELS } from "@/lib/templates";
import { Laudo } from "@/types";
import PrintButton from "./PrintButton";
import EditRawInput from "./EditRawInput";
import ImageManager from "./ImageManager";

const BUCKET = "laudo-images";

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

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: rawImages } = await admin
    .from("laudo_images")
    .select("*")
    .eq("laudo_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const images = (rawImages ?? []).map((img) => ({
    id: img.id,
    file_name: img.file_name,
    url: admin.storage.from(BUCKET).getPublicUrl(img.storage_path).data.publicUrl,
  }));

  const l = laudo as Laudo;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="print:hidden bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
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
          <ImageManager laudoId={l.id} initialImages={images} />
        </div>
        <div className="print:hidden">
          <EditRawInput laudoId={l.id} initialRawInput={l.raw_input} />
        </div>
      </main>
    </div>
  );
}
