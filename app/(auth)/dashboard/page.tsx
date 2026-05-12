import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import ReportList from "./ReportList";
import Loading from "./loading";

async function DashboardContents() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;
  return <ReportList userId={user.id} />;
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
