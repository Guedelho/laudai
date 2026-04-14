import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import LaudoList from "./LaudoList";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdmin();
  const { data: laudos } = await admin
    .from("laudos")
    .select("id, patient_name, owner_name, specialty, created_at, updated_at")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader current="/dashboard" />
      <main className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Laudos Recentes</h2>
        <LaudoList laudos={laudos ?? []} />
      </main>
    </div>
  );
}
