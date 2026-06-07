import "server-only";

import type { createAdmin } from "@/lib/supabase/admin";
import { getCurrentOrgId } from "@/lib/supabase/auth";
import { normalizeAccount } from "@/lib/account";
import { logError } from "@/lib/log";
import type { AccountProfileFields } from "@/shared/interfaces";

type Admin = ReturnType<typeof createAdmin>;

export class AccountConflictError extends Error {
  field: "cpf" | "crmv";
  constructor(field: "cpf" | "crmv") {
    super(`account conflict on ${field}`);
    this.name = "AccountConflictError";
    this.field = field;
  }
}

function buildSlug(fullName: string, userId: string, attempt: number): string {
  const base =
    fullName
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "conta";
  const suffix = userId.replace(/-/g, "").slice(0, 8);
  return `${base}-${attempt === 0 ? suffix : `${suffix}${attempt}`}`;
}

export async function provisionAccount(admin: Admin, userId: string, fields: AccountProfileFields): Promise<string> {
  const { full_name, cpf, crmv, crmv_state } = normalizeAccount(fields);

  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await admin.rpc("provision_account", {
      p_user_id: userId,
      p_full_name: full_name,
      p_cpf: cpf,
      p_crmv: crmv,
      p_crmv_state: crmv_state,
      p_slug: buildSlug(full_name, userId, attempt),
    });

    if (!error) return data as string;

    if (error.code === "23505") {
      const detail = `${error.message} ${error.details ?? ""}`.toLowerCase();
      if (detail.includes("profiles_cpf_unique")) throw new AccountConflictError("cpf");
      if (detail.includes("profiles_crmv_unique")) throw new AccountConflictError("crmv");
      if (detail.includes("profiles_pkey")) return getCurrentOrgId(userId);
      if (detail.includes("slug")) continue;
    }

    logError("provisionAccount failed", error, { userId });
    throw error;
  }

  throw new Error("provisionAccount: exhausted slug attempts");
}
