import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdmin } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/supabase/profile";
import { provisionAccount, AccountConflictError } from "@/lib/supabase/provisioning";
import { logError } from "@/lib/log";

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
  return raw;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(url.searchParams.get("next"));

  const supabase = await createClient();

  const result = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : null;

  if (!result) return NextResponse.redirect(`${origin}/login?error=auth`);
  if (result.error) {
    logError("auth callback failed", result.error);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?error=auth`);

  const admin = createAdmin();
  if (await getProfile(admin, user.id)) return NextResponse.redirect(`${origin}${next}`);

  const md = user.user_metadata ?? {};
  if (md.cpf && md.crmv && md.crmv_state) {
    try {
      await provisionAccount(admin, user.id, {
        full_name: md.full_name ?? md.name ?? "",
        cpf: md.cpf,
        crmv: md.crmv,
        crmv_state: md.crmv_state,
      });
      return NextResponse.redirect(`${origin}${next}`);
    } catch (err) {
      if (!(err instanceof AccountConflictError)) logError("provision on callback failed", err, { userId: user.id });
      return NextResponse.redirect(`${origin}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/onboarding`);
}
