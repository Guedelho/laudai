import "server-only";

import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { getStripe } from "@/lib/stripe/server";
import { TABLES } from "@/shared/constants";

export const POST = withApiHandler(async ({ admin, orgId }) => {
  const { data: org } = await admin.from(TABLES.organizations).select("stripe_customer_id").eq("id", orgId).single();

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: "Nenhuma assinatura encontrada." }, { status: 404 });
  }

  const session = await getStripe().billingPortal.sessions.create({
    customer: org.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL!}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
});
