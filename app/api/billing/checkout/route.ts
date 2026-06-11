import "server-only";

import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { getStripe, PLAN_PRICE_IDS, type PlanInterval } from "@/lib/stripe/server";
import { ensureStripeCustomer } from "@/lib/stripe/subscription";
import { TABLES } from "@/shared/constants";
import { logError } from "@/lib/log";

export const POST = withApiHandler(async ({ admin, userId, orgId, req }) => {
  const body = await req.json().catch(() => ({}));
  const plan: PlanInterval = body?.plan === "yearly" ? "yearly" : "monthly";
  const priceId = PLAN_PRICE_IDS[plan]();

  const { data: org, error: orgErr } = await admin
    .from(TABLES.organizations)
    .select("name, stripe_customer_id, stripe_subscription_status")
    .eq("id", orgId)
    .single();

  if (orgErr || !org) {
    logError("Checkout: org lookup failed", orgErr, { userId, orgId });
    return NextResponse.json({ error: "Organização não encontrada." }, { status: 404 });
  }

  if (org.stripe_subscription_status === "active" || org.stripe_subscription_status === "trialing") {
    return NextResponse.json({ error: "Assinatura já está ativa." }, { status: 409 });
  }

  const customerId = await ensureStripeCustomer(admin, orgId, userId, org);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      metadata: { org_id: orgId },
    },
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/dashboard?checkout=canceled`,
    client_reference_id: orgId,
    allow_promotion_codes: true,
  });

  if (!session.url) {
    logError("Checkout: missing session url", null, { userId, orgId, sessionId: session.id });
    return NextResponse.json({ error: "Erro ao criar checkout." }, { status: 500 });
  }

  return NextResponse.json({ url: session.url });
});
