import "server-only";

import type { createAdmin } from "@/lib/supabase/admin";
import { logError } from "@/lib/log";

type Admin = ReturnType<typeof createAdmin>;

export interface RateLimitConfig {
  endpoint: string;
  max: number;
  windowSec: number;
}

// Fails open: a broken limiter shouldn't block legitimate users.
export async function checkRateLimit(admin: Admin, userId: string, limit: RateLimitConfig): Promise<boolean> {
  const windowStartMs = Math.floor(Date.now() / (limit.windowSec * 1000)) * limit.windowSec * 1000;
  const windowStart = new Date(windowStartMs).toISOString();

  const { data, error } = await admin.rpc("check_rate_limit", {
    p_user_id: userId,
    p_endpoint: limit.endpoint,
    p_window_start: windowStart,
  });

  if (error) {
    logError("Rate limit check failed", error, { userId, endpoint: limit.endpoint });
    return true;
  }

  return (data ?? 0) <= limit.max;
}
