import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/supabase/auth";
import { TABLES, ENTITLED_SUBSCRIPTION_STATUSES } from "@/shared/constants";
import ReportList from "./ReportList";
import SubscribeGate from "./SubscribeGate";
import Loading from "./loading";

async function DashboardContents() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
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
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Laudos Recentes</h1>
      <Suspense fallback={<Loading />}>
        <DashboardContents />
      </Suspense>
    </main>
  );
}
