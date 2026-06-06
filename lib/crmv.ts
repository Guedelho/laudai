import { BR_STATE_CODES } from "@/shared/constants";

export function normalizeCrmv(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function isValidCrmv(value: string): boolean {
  const v = normalizeCrmv(value);
  return v.length >= 1 && v.length <= 20 && /\d/.test(v);
}

export function isValidCrmvState(value: string): boolean {
  return BR_STATE_CODES.has(value);
}
