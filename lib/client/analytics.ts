import { sendGTMEvent } from "@next/third-parties/google";

type AnalyticsEvent =
  | { event: "sign_up" }
  | { event: "login" }
  | { event: "begin_checkout"; plan: "monthly" | "yearly" }
  | { event: "subscription_started" }
  | { event: "generate_laudo"; method: "form" | "chat" };

export function trackEvent(data: AnalyticsEvent): void {
  if (!process.env.NEXT_PUBLIC_GTM_ID) return;
  sendGTMEvent(data);
}
