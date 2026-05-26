import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { TABLES, REPORT_TYPES, ENTITLED_SUBSCRIPTION_STATUSES } from "@/shared/constants";
import AppHeader from "@/components/AppHeader";
import SubscriptionChip from "./SubscriptionChip";

async function AuthGate({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <>{children}</>;
}

async function HeaderWithChip() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <AppHeader />;

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
  if (!ENTITLED_SUBSCRIPTION_STATUSES.has(status)) return <AppHeader />;

  return (
    <AppHeader
      subscriptionChip={
        <SubscriptionChip
          status={status as "trialing" | "active" | "past_due"}
          periodEnd={entitlement?.expires_at ?? null}
        />
      }
    />
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<header className="bg-white border-b border-gray-200 h-16" />}>
        <HeaderWithChip />
      </Suspense>
      <Suspense fallback={null}>
        <AuthGate>{children}</AuthGate>
      </Suspense>
    </div>
  );
}
