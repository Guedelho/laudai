import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { checkBotId } from "botid/server";
import { getUserId, getCurrentOrgId } from "@/lib/supabase/auth";
import { createAdmin } from "@/lib/supabase/admin";
import { logAudit, type AuditFn } from "@/lib/audit";
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

export function clientIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
}

interface BaseOpts {
  // { botId: false } for routes loaded by <img>/<a download>/top-level navigation
  // — those can't carry BotID headers. Cookies still gate access.
  botId?: boolean;
}

type Route<P> = (req: NextRequest, ctx?: { params: Promise<P> }) => Promise<Response>;

// Shared shell: BotID gate + param resolution + uncaught-error handling. The
// auth/org wrappers below layer their context on top of this.
function guarded<P>(opts: BaseOpts, run: (req: NextRequest, params: P) => Promise<Response>): Route<P> {
  return async (req, ctx) => {
    try {
      if (opts.botId !== false) {
        const { isBot } = await checkBotId();
        if (isBot) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
      }
      const params = ctx ? ((await ctx.params) as P) : ({} as P);
      return await run(req, params);
    } catch (err) {
      logError("API handler uncaught", err, { method: req.method, path: req.nextUrl.pathname });
      return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
    }
  };
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Public — no auth, no org. For pre-auth endpoints (e.g. signup validation).
interface PublicCtx<P> {
  req: NextRequest;
  params: P;
  admin: Admin;
}

export function withPublicHandler<P = Record<string, never>>(
  handler: (ctx: PublicCtx<P>) => Promise<Response>,
  opts: BaseOpts = {},
): Route<P> {
  return guarded<P>(opts, (req, params) => handler({ req, params, admin: createAdmin() }));
}

// Authenticated but org-less — for requests that run before the user's org
// exists (e.g. onboarding, which creates the profile + org).
interface AuthCtx<P> {
  userId: string;
  req: NextRequest;
  params: P;
  admin: Admin;
}

export function withAuthHandler<P = Record<string, never>>(
  handler: (ctx: AuthCtx<P>) => Promise<Response>,
  opts: BaseOpts = {},
): Route<P> {
  return guarded<P>(opts, async (req, params) => {
    const userId = await getUserId();
    if (!userId) return unauthorized();
    return handler({ userId, req, params, admin: createAdmin() });
  });
}

// Authenticated + org-scoped — the default for almost every route.
interface HandlerCtx<P> {
  userId: string;
  orgId: string;
  req: NextRequest;
  params: P;
  admin: Admin;
  audit: AuditFn;
}

interface HandlerOpts extends BaseOpts {
  rateLimit?: RateLimitConfig;
}

export function withApiHandler<P = Record<string, never>>(
  handler: (ctx: HandlerCtx<P>) => Promise<Response>,
  opts: HandlerOpts = {},
): Route<P> {
  return guarded<P>(opts, async (req, params) => {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const orgId = await getCurrentOrgId(userId);
    const admin = createAdmin();

    if (opts.rateLimit) {
      const allowed = await checkRateLimit(admin, userId, opts.rateLimit);
      if (!allowed) {
        return NextResponse.json({ error: "Muitas requisições. Tente novamente em instantes." }, { status: 429 });
      }
    }

    const audit: HandlerCtx<P>["audit"] = (args) => logAudit(admin, { orgId, userId, ...args });
    return handler({ userId, orgId, req, params, admin, audit });
  });
}
