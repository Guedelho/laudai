import { Suspense } from "react";
import Link from "next/link";
import { createAdmin } from "@/lib/supabase/admin";
import { getServerUser, getCurrentOrgId } from "@/lib/supabase/auth";
import { TABLES, ENTITLED_SUBSCRIPTION_STATUSES } from "@/shared/constants";
import ReportList from "./ReportList";
import SubscribeGate from "./SubscribeGate";
import Loading from "./loading";

async function DashboardContents() {
  const user = await getServerUser();
  if (!user) return null;

  const orgId = await getCurrentOrgId(user.id);
  const admin = createAdmin();
  const { data: org } = await admin
    .from(TABLES.organizations)
    .select("stripe_subscription_status")
    .eq("id", orgId)
    .single();

  if (!ENTITLED_SUBSCRIPTION_STATUSES.has(org?.stripe_subscription_status ?? "")) {
    return <SubscribeGate />;
  }

  return <ReportList userId={user.id} orgId={orgId} />;
}

export default function DashboardPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Laudos Recentes</h1>
        <Link
          href="/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Novo Laudo
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <DashboardContents />
      </Suspense>
    </main>
  );
}
