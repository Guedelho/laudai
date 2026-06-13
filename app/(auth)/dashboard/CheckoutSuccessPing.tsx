"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/client/analytics";

export default function CheckoutSuccessPing() {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("checkout") !== "success") return;
    trackEvent({ event: "subscription_started" });
    url.searchParams.delete("checkout");
    window.history.replaceState(null, "", url.pathname + url.search);
  }, []);
  return null;
}
