import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import LaudoList from "./LaudoList";

export default async function DashboardPage() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const admin = createAdmin();
  const { data: laudos } = await admin
    .from("laudos")
    .select("id, patient_name, owner_name, specialty, created_at, exam_date")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Laudos Recentes</h2>
      <LaudoList laudos={laudos ?? []} />
    </main>
  );
}
