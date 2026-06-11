import { Suspense } from "react";
import { createAdmin } from "@/lib/supabase/admin";
import { getServerUser, getCurrentOrgId } from "@/lib/supabase/auth";
import { getProfile } from "@/lib/supabase/profile";
import { redirect } from "next/navigation";
import { isOrgOwner } from "@/lib/supabase/org";
import { TABLES, REPORT_TYPES, ENTITLED_SUBSCRIPTION_STATUSES } from "@/shared/constants";
import AppSidebar from "@/components/AppSidebar";
import SubscriptionChip from "./SubscriptionChip";

async function AuthGate({ children }: { children: React.ReactNode }) {
  const user = await getServerUser();
  if (!user) redirect("/login");
  const profile = await getProfile(createAdmin(), user.id);
  if (!profile) redirect("/onboarding");
  return <>{children}</>;
}

async function SidebarWithChip() {
  const user = await getServerUser();
  if (!user) return <AppSidebar />;

  let orgId: string;
  try {
    orgId = await getCurrentOrgId(user.id);
  } catch {
    return <AppSidebar userEmail={user.email} />;
  }
  const admin = createAdmin();
  const [{ data: org }, { data: entitlement }, owner] = await Promise.all([
    admin.from(TABLES.organizations).select("stripe_subscription_status").eq("id", orgId).single(),
    admin
      .from(TABLES.organization_report_types)
      .select("expires_at")
      .eq("org_id", orgId)
      .eq("report_type_id", REPORT_TYPES.ultrasound_abdominal)
      .maybeSingle(),
    isOrgOwner(admin, user.id, orgId),
  ]);

  const status = org?.stripe_subscription_status ?? "";
  if (!ENTITLED_SUBSCRIPTION_STATUSES.has(status)) return <AppSidebar userEmail={user.email} />;

  // Every member sees the plan status; only owners can open the billing portal.
  return (
    <AppSidebar
      userEmail={user.email}
      subscriptionChip={
        <SubscriptionChip
          status={status as "trialing" | "active" | "past_due"}
          periodEnd={entitlement?.expires_at ?? null}
          canManage={owner}
        />
      }
    />
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense
        fallback={<aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 bg-white md:block" />}
      >
        <SidebarWithChip />
      </Suspense>
      <div className="md:pl-64">
        <Suspense fallback={null}>
          <AuthGate>{children}</AuthGate>
        </Suspense>
      </div>
    </div>
  );
}
