import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import ReportList from "./ReportList";

export default async function DashboardPage() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const admin = createAdmin();
  const { data: reports } = await admin
    .from("reports")
    .select("id, patient_name, owner_name, clinic_name, specialty, created_at, exam_date")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Laudos Recentes</h2>
      <ReportList reports={reports ?? []} />
    </main>
  );
}
