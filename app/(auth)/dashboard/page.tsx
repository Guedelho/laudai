import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/supabase/auth";
import { TABLES, REPORT_TYPES } from "@/shared/constants";
import ReportList from "./ReportList";
import SubscribeGate from "./SubscribeGate";
import SubscriptionStatus from "./SubscriptionStatus";
import Loading from "./loading";

const ENTITLED_STATUSES = new Set(["trialing", "active", "past_due"]);

async function DashboardContents() {
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  if (!user) return null;

  const orgId = await getCurrentOrgId(user.id);
  const admin = createAdmin();

  const [{ data: org }, { data: entitlement }] = await Promise.all([
    admin.from(TABLES.organizations).select("stripe_subscription_status").eq("id", orgId).single(),
    admin
      .from(TABLES.organization_report_types)
      .select("expires_at")
      .eq("org_id", orgId)
      .eq("report_type_id", REPORT_TYPES.ultrasound_abdominal)
      .maybeSingle(),
  ]);

  const status = org?.stripe_subscription_status ?? "";

  if (!ENTITLED_STATUSES.has(status)) {
    return <SubscribeGate />;
  }

  return (
    <>
      <SubscriptionStatus
        status={status as "trialing" | "active" | "past_due"}
        periodEnd={entitlement?.expires_at ?? null}
      />
      <ReportList userId={user.id} orgId={orgId} />
    </>
  );
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
