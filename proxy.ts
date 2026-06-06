import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_EXACT = new Set(["/login", "/home"]);
// /webhook — Stripe (and future server-to-server callers). Outside /api so
// Vercel BotID doesn't challenge the request before our signature check runs.
const PUBLIC_PREFIXES = ["/legal", "/webhook/"];

function isPublicPath(path: string): boolean {
  return PUBLIC_EXACT.has(path) || PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export default async function proxy(request: NextRequest) {
  // Root domain serves the public landing page at "/"; every other path is
  // forwarded to app.laudai.vet so the auth cookie stays anchored to one host.
  const host = request.headers.get("host");
  const path = request.nextUrl.pathname;
  if (host === "laudai.vet" || host === "www.laudai.vet") {
    if (path === "/") {
      return NextResponse.rewrite(new URL("/home", request.url));
    }
    const url = request.nextUrl.clone();
    url.host = "app.laudai.vet";
    return NextResponse.redirect(url, 307);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicPath(path) && !path.startsWith("/api/")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
