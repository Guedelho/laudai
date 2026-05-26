import "server-only";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdmin } from "@/lib/supabase/admin";
import { TABLES, REPORT_TYPES, ENTITLED_SUBSCRIPTION_STATUSES } from "@/shared/constants";
import { logError, logInfo } from "@/lib/log";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const payload = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logError("Stripe webhook: signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdmin();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.trial_will_end": {
        await syncSubscription(admin, event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoiceSubscriptionId(invoice);
        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          await syncSubscription(admin, sub);
        }
        break;
      }
      default:
        // Acknowledge unknown events so Stripe stops retrying.
        logInfo("Stripe webhook: ignored event", { type: event.type, id: event.id });
    }
  } catch (err) {
    logError("Stripe webhook: handler failed", err, { type: event.type, id: event.id });
    // 500 makes Stripe retry — desired for transient failures.
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(admin: ReturnType<typeof createAdmin>, sub: Stripe.Subscription): Promise<void> {
  const orgId = sub.metadata.org_id;
  if (!orgId) {
    logError("Stripe webhook: subscription has no org_id metadata", null, { subscriptionId: sub.id });
    return;
  }

  await admin
    .from(TABLES.organizations)
    .update({
      stripe_subscription_id: sub.id,
      stripe_subscription_status: sub.status,
    })
    .eq("id", orgId);

  if (ENTITLED_SUBSCRIPTION_STATUSES.has(sub.status)) {
    // Period end carries the trial end date during the trial, and the next
    // renewal date after the first invoice — both map to "access until X".
    const expiresAt = new Date(subscriptionPeriodEnd(sub) * 1000).toISOString();
    const { error } = await admin
      .from(TABLES.organization_report_types)
      .upsert(
        { org_id: orgId, report_type_id: REPORT_TYPES.ultrasound_abdominal, expires_at: expiresAt },
        { onConflict: "org_id,report_type_id" },
      );
    if (error) logError("Stripe webhook: upsert entitlement failed", error, { orgId, subscriptionId: sub.id });
  } else {
    const { error } = await admin
      .from(TABLES.organization_report_types)
      .delete()
      .eq("org_id", orgId)
      .eq("report_type_id", REPORT_TYPES.ultrasound_abdominal);
    if (error) logError("Stripe webhook: delete entitlement failed", error, { orgId, subscriptionId: sub.id });
  }
}

// The dahlia API moved current_period_end from Subscription to SubscriptionItem.
function subscriptionPeriodEnd(sub: Stripe.Subscription): number {
  const ends = sub.items.data.map((i) => i.current_period_end).filter((n): n is number => typeof n === "number");
  if (ends.length === 0) throw new Error(`Subscription ${sub.id} has no item period end`);
  return Math.max(...ends);
}

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent;
  if (parent?.type === "subscription_details" && parent.subscription_details) {
    const sub = parent.subscription_details.subscription;
    return typeof sub === "string" ? sub : (sub?.id ?? null);
  }
  return null;
}
