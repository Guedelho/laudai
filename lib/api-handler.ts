import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { getUserId, getCurrentOrgId } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { logAudit, type AuditAction, type AuditEntity } from "@/lib/audit";
import { logError } from "@/lib/log";
import { checkRateLimit, type RateLimitConfig } from "@/lib/rate-limit";

type Admin = ReturnType<typeof createAdmin>;

export async function loadOwned<T = Record<string, unknown>>(
  admin: Admin,
  table: string,
  id: string,
  userId: string,
): Promise<T | null> {
  const { data } = await admin.from(table).select("*").eq("id", id).eq("user_id", userId).maybeSingle();
  return (data as T | null) ?? null;
}

interface HandlerCtx<P> {
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

interface HandlerOpts {
  // { botId: false } for routes loaded by <img>/<a download>/top-level navigation
  // — those can't carry BotID headers. Cookies still gate access.
  botId?: boolean;
  rateLimit?: RateLimitConfig;
}

export function withApiHandler<P = Record<string, never>>(
  handler: Handler<P>,
  opts: HandlerOpts = {},
): (req: NextRequest, ctx?: { params: Promise<P> }) => Promise<Response> {
  return async (req, ctx) => {
    try {
      if (opts.botId !== false) {
        const { isBot } = await checkBotId();
        if (isBot) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
      }

      const userId = await getUserId();
      if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const orgId = await getCurrentOrgId(userId);
      const params = ctx ? ((await ctx.params) as P) : ({} as P);
      const admin = createAdmin();

      if (opts.rateLimit) {
        const allowed = await checkRateLimit(admin, userId, opts.rateLimit);
        if (!allowed) {
          return NextResponse.json({ error: "Muitas requisições. Tente novamente em instantes." }, { status: 429 });
        }
      }

      const audit: HandlerCtx<P>["audit"] = (args) => logAudit(admin, { orgId, userId, ...args });

      return await handler({ userId, orgId, req, params, admin, audit });
    } catch (err) {
      logError("API handler uncaught", err, { method: req.method, path: req.nextUrl.pathname });
      return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
    }
  };
}
