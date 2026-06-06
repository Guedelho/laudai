import { jsonBody } from "@/lib/fetch";
import type { SignupValidateRequest, OnboardingRequest, AccountFieldError } from "@/shared/interfaces";

export class AccountError extends Error {
  field?: AccountFieldError["field"];
  constructor(message: string, field?: AccountFieldError["field"]) {
    super(message);
    this.name = "AccountError";
    this.field = field;
  }
}

async function postAccount(url: string, body: unknown): Promise<void> {
  const res = await fetch(url, { method: "POST", ...jsonBody(body) });
  if (!res.ok) {
    const data: AccountFieldError = await res.json().catch(() => ({}));
    throw new AccountError(data.error || "Erro inesperado.", data.field);
  }
}

export function validateSignup(body: SignupValidateRequest): Promise<void> {
  return postAccount("/api/auth/signup-validate", body);
}

export function submitOnboarding(body: OnboardingRequest): Promise<void> {
  return postAccount("/api/onboarding", body);
}
