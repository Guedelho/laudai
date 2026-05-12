import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "@/lib/supabase/auth";
import { isSameOriginRequest } from "@/lib/csrf";
import { consumeRateLimit } from "@/lib/rate-limit";
import { logError } from "@/lib/log";

type RateLimitOpts = { name: string; maxPerMinute: number };

type Handler<P> = (ctx: { userId: string; req: NextRequest; params: P }) => Promise<Response>;

interface Options {
  /** Skip auth check (defaults to false). */
  publicAccess?: boolean;
  /** Per-user rate limit. Defaults to DEFAULT_RATE_LIMIT for authenticated routes. */
  rateLimit?: RateLimitOpts;
  /** Default: enforce same-origin on non-GET/HEAD requests. */
  csrf?: boolean;
}

const DEFAULT_RATE_LIMIT: RateLimitOpts = { name: "default", maxPerMinute: 60 };

export function withApiHandler<P = Record<string, never>>(
  opts: Options,
  handler: Handler<P>,
): (req: NextRequest, ctx?: { params: Promise<P> }) => Promise<Response> {
  return async (req, ctx) => {
    try {
      const csrfDefault = req.method !== "GET" && req.method !== "HEAD";
      const csrf = opts.csrf ?? csrfDefault;
      if (csrf && !isSameOriginRequest(req)) {
        return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
      }

      let userId = "";
      if (!opts.publicAccess) {
        const id = await getUserId();
        if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        userId = id;
      }

      const rateLimit = opts.publicAccess ? opts.rateLimit : (opts.rateLimit ?? DEFAULT_RATE_LIMIT);
      if (rateLimit) {
        const allowed = await consumeRateLimit(rateLimit.name, userId, rateLimit.maxPerMinute);
        if (!allowed) return NextResponse.json({ error: "Muitas requisições. Aguarde um momento." }, { status: 429 });
      }

      const params = ctx ? ((await ctx.params) as P) : ({} as P);
      return await handler({ userId, req, params });
    } catch (err) {
      logError("API handler uncaught", err, { method: req.method, path: req.nextUrl.pathname });
      return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
    }
  };
}
