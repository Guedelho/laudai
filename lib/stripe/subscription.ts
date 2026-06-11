import "server-only";

import type Stripe from "stripe";
import { getStripe, PLAN_PRICE_IDS } from "@/lib/stripe/server";
import type { createAdmin } from "@/lib/supabase/admin";
import { TABLES, SUBSCRIPTION_REPORT_TYPES, ENTITLED_SUBSCRIPTION_STATUSES } from "@/shared/constants";
import type { BillingOverview, PlanOverview } from "@/shared/interfaces";
import { logError } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

// The dahlia API moved current_period_end from Subscription to SubscriptionItem.
function subscriptionPeriodEnd(sub: Stripe.Subscription): number | null {
  const ends = sub.items.data.map((i) => i.current_period_end).filter((n): n is number => typeof n === "number");
  return ends.length === 0 ? null : Math.max(...ends);
}

export async function syncSubscription(admin: Admin, sub: Stripe.Subscription): Promise<void> {
  const orgId = sub.metadata.org_id;
  if (!orgId) {
    logError("syncSubscription: subscription has no org_id metadata", null, { subscriptionId: sub.id });
    return;
  }

  const { data: org } = await admin
    .from(TABLES.organizations)
    .select("stripe_customer_id")
    .eq("id", orgId)
    .maybeSingle();
  const subCustomer = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (org?.stripe_customer_id && subCustomer && org.stripe_customer_id !== subCustomer) {
    logError("syncSubscription: customer/org mismatch", null, { orgId, subscriptionId: sub.id });
    return;
  }

  await admin
    .from(TABLES.organizations)
    .update({ stripe_subscription_id: sub.id, stripe_subscription_status: sub.status })
    .eq("id", orgId);

  if (ENTITLED_SUBSCRIPTION_STATUSES.has(sub.status)) {
    const periodEnd = subscriptionPeriodEnd(sub);
    if (periodEnd === null) {
      logError("syncSubscription: subscription has no item period end", null, { subscriptionId: sub.id });
      return;
    }
    const expiresAt = new Date(periodEnd * 1000).toISOString();
    const { error } = await admin.from(TABLES.organization_report_types).upsert(
      SUBSCRIPTION_REPORT_TYPES.map((report_type_id) => ({ org_id: orgId, report_type_id, expires_at: expiresAt })),
      { onConflict: "org_id,report_type_id" },
    );
    if (error) logError("syncSubscription: upsert entitlement failed", error, { orgId, subscriptionId: sub.id });
  } else {
    const { error } = await admin
      .from(TABLES.organization_report_types)
      .delete()
      .eq("org_id", orgId)
      .in("report_type_id", [...SUBSCRIPTION_REPORT_TYPES]);
    if (error) logError("syncSubscription: delete entitlement failed", error, { orgId, subscriptionId: sub.id });
  }
}

interface OrgBilling {
  name: string | null;
  stripe_customer_id: string | null;
}

export async function ensureStripeCustomer(
  admin: Admin,
  orgId: string,
  userId: string,
  org: OrgBilling,
): Promise<string> {
  if (org.stripe_customer_id) return org.stripe_customer_id;

  const [{ data: profile }, { data: authUser }] = await Promise.all([
    admin.from(TABLES.profiles).select("full_name").eq("id", userId).maybeSingle(),
    admin.auth.admin.getUserById(userId),
  ]);

  const customer = await getStripe().customers.create({
    email: authUser?.user?.email ?? undefined,
    name: profile?.full_name ?? org.name ?? undefined,
    metadata: { org_id: orgId, user_id: userId },
  });

  await admin.from(TABLES.organizations).update({ stripe_customer_id: customer.id }).eq("id", orgId);
  return customer.id;
}

function planFromSubscription(sub: Stripe.Subscription): PlanOverview {
  const price = sub.items.data[0]?.price;
  const periodEnd = subscriptionPeriodEnd(sub);
  return {
    status: sub.status,
    interval: price?.recurring?.interval === "year" ? "year" : price?.recurring ? "month" : null,
    amount: price?.unit_amount ?? null,
    currency: price?.currency ?? "brl",
    currentPeriodEnd: periodEnd === null ? null : new Date(periodEnd * 1000).toISOString(),
    trialing: sub.status === "trialing",
  };
}

export async function getBillingOverview(admin: Admin, orgId: string): Promise<BillingOverview | null> {
  const { data: org } = await admin
    .from(TABLES.organizations)
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", orgId)
    .maybeSingle();

  if (!org?.stripe_customer_id) return null;

  const stripe = getStripe();
  const [sub, invoiceList] = await Promise.all([
    org.stripe_subscription_id
      ? stripe.subscriptions.retrieve(org.stripe_subscription_id).catch(() => null)
      : Promise.resolve(null),
    stripe.invoices.list({ customer: org.stripe_customer_id, limit: 12 }).catch(() => null),
  ]);

  return {
    plan: sub ? planFromSubscription(sub) : null,
    invoices: (invoiceList?.data ?? [])
      .filter((inv) => inv.status !== "draft")
      .map((inv) => ({
        id: inv.id ?? "",
        created: new Date(inv.created * 1000).toISOString(),
        status: inv.status ?? "open",
        amount: inv.amount_paid || inv.amount_due,
        currency: inv.currency,
        hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
      })),
  };
}

// `missing_payment_method: "cancel"` lets Stripe create the trial with no card and
// cancel cleanly at trial end. Best-effort: a Stripe failure must not break signup.
export async function startTrialSubscription(admin: Admin, orgId: string, userId: string): Promise<void> {
  try {
    const { data: org } = await admin
      .from(TABLES.organizations)
      .select("name, stripe_customer_id, stripe_subscription_id, stripe_subscription_status")
      .eq("id", orgId)
      .single();
    if (!org) return;
    if (org.stripe_subscription_id || ENTITLED_SUBSCRIPTION_STATUSES.has(org.stripe_subscription_status ?? "")) return;

    const customerId = await ensureStripeCustomer(admin, orgId, userId, org);
    const sub = await getStripe().subscriptions.create({
      customer: customerId,
      items: [{ price: PLAN_PRICE_IDS.monthly() }],
      trial_period_days: 7,
      trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      metadata: { org_id: orgId },
    });

    await syncSubscription(admin, sub);
  } catch (err) {
    logError("startTrialSubscription failed", err, { orgId, userId });
  }
}
