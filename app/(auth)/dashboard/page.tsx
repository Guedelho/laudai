import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { DASHBOARD_PAGE_SIZE } from "@/shared/constants";
import ReportList from "./ReportList";
import Loading from "./loading";

async function DashboardContents() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const admin = createAdmin();
  const { data: reports } = await admin
    .from("reports")
    .select("id, patient_name, owner_name, clinic_name, specialty, created_at, exam_date, status, error_message")
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(DASHBOARD_PAGE_SIZE);

  return <ReportList userId={user.id} initialReports={reports ?? []} />;
}

export default function DashboardPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Laudos Recentes</h2>
      <Suspense fallback={<Loading />}>
        <DashboardContents />
      </Suspense>
    </main>
  );
}
