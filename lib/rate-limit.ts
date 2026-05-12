import "server-only";

import { createAdmin } from "@/lib/supabase/admin";
import { logError } from "@/lib/log";

/**
 * Atomically counts and (if under the cap) records a request.
 * Returns true when the request is within the cap and was recorded.
 *
 * Backed by Postgres so limits are shared across all Vercel function
 * instances and survive cold starts. Fails open if the RPC errors.
 */
export async function consumeRateLimit(bucket: string, userId: string, maxPerMinute: number): Promise<boolean> {
  const admin = createAdmin();
  const { data, error } = await admin.rpc("rate_limit_consume", {
    p_bucket: bucket,
    p_user_id: userId,
    p_max: maxPerMinute,
  });
  if (error) {
    logError("Rate limit RPC failed", error, { bucket, userId });
    return true;
  }
  return data === true;
}
