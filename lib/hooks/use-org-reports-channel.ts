"use client";

import { useEffect, useRef } from "react";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface Handlers<T> {
  // Fired for every `report_changed` broadcast on the org channel.
  onEvent: (payload: T) => void;
  // Fired once the channel reaches SUBSCRIBED. Poll current state here to close
  // the race window between an initial read and the channel going live.
  onSubscribed?: () => void;
}

// Subscribes to the private `org:<orgId>:reports` broadcast channel and forwards
// `report_changed` events. Broadcast (not postgres_changes) because the latter
// evaluates table RLS, which the recursive org-membership policy chain aborts.
export function useOrgReportsChannel<T extends { id: string }>(orgId: string, handlers: Handlers<T>): void {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    async function init() {
      await supabase.realtime.setAuth();
      if (cancelled) return;

      channel = supabase
        .channel(`org:${orgId}:reports`, { config: { private: true } })
        .on<T>("broadcast", { event: "report_changed" }, ({ payload }) => {
          if (!cancelled) handlersRef.current.onEvent(payload);
        })
        .subscribe((status, err) => {
          if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
            if (!cancelled) handlersRef.current.onSubscribed?.();
          } else if (
            status === REALTIME_SUBSCRIBE_STATES.CHANNEL_ERROR ||
            status === REALTIME_SUBSCRIBE_STATES.TIMED_OUT
          ) {
            console.error(`Realtime channel ${status}`, err);
          }
        });
    }

    init();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [orgId]);
}
