import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { getUserId, getCurrentOrgId } from "@/lib/supabase/auth";
import { isSameOriginRequest } from "@/lib/csrf";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createAdmin } from "@/lib/supabase/admin";
import { logAudit, type AuditAction, type AuditEntity } from "@/lib/audit";
import { logError } from "@/lib/log";

type RateLimitOpts = { name: string; maxPerMinute: number };
type Admin = ReturnType<typeof createAdmin>;

export interface HandlerCtx<P> {
  userId: string;
  orgId: string;
  req: NextRequest;
  params: P;
  admin: Admin;
  audit: (args: {
    action: AuditAction;
    entityType: AuditEntity;
    entityId: string;
    changes?: Record<string, unknown> | null;
  }) => Promise<void>;
}

type Handler<P> = (ctx: HandlerCtx<P>) => Promise<Response>;

interface Options {
  publicAccess?: boolean;
  rateLimit?: RateLimitOpts;
  csrf?: boolean;
  botId?: boolean;
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

      if (opts.botId) {
        const { isBot } = await checkBotId();
        if (isBot) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
      }

      let userId = "";
      let orgId = "";
      if (!opts.publicAccess) {
        const id = await getUserId();
        if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        userId = id;
        orgId = await getCurrentOrgId(userId);
      }

      const rateLimit = opts.publicAccess ? opts.rateLimit : (opts.rateLimit ?? DEFAULT_RATE_LIMIT);
      if (rateLimit) {
        const allowed = await consumeRateLimit(rateLimit.name, userId, rateLimit.maxPerMinute);
        if (!allowed) return NextResponse.json({ error: "Muitas requisições. Aguarde um momento." }, { status: 429 });
      }

      const params = ctx ? ((await ctx.params) as P) : ({} as P);
      const admin = createAdmin();
      const audit: HandlerCtx<P>["audit"] = (args) => logAudit(admin, { orgId: orgId || null, userId, ...args });

      return await handler({ userId, orgId, req, params, admin, audit });
    } catch (err) {
      logError("API handler uncaught", err, { method: req.method, path: req.nextUrl.pathname });
      return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
    }
  };
}
