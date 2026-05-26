import "server-only";

import Stripe from "stripe";

let _stripe: Stripe | null = null;

// Lazy init so `next build` page-data collection (which evaluates modules
// without runtime env) doesn't crash on missing STRIPE_SECRET_KEY.
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
  return _stripe;
}

export const PLAN_PRICE_IDS = {
  monthly: () => process.env.STRIPE_PRICE_ID_MONTHLY!,
  yearly: () => process.env.STRIPE_PRICE_ID_YEARLY!,
} as const;

export type PlanInterval = keyof typeof PLAN_PRICE_IDS;
