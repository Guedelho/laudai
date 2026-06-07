import { validateCpf, normalizeCpf } from "@/lib/cpf";
import { normalizeCrmv, isValidCrmv, isValidCrmvState } from "@/lib/crmv";
import type { AccountProfileFields, AccountFieldError } from "@/shared/interfaces";

export type AccountField = NonNullable<AccountFieldError["field"]>;
export type FieldErrors = Partial<Record<AccountField, string>>;

export function normalizeAccount(fields: AccountProfileFields): AccountProfileFields {
  return {
    full_name: (fields.full_name ?? "").trim(),
    cpf: normalizeCpf(fields.cpf ?? ""),
    crmv: normalizeCrmv(fields.crmv ?? ""),
    crmv_state: (fields.crmv_state ?? "").trim().toUpperCase(),
  };
}

export function validateAccountFields(fields: AccountProfileFields): FieldErrors {
  const errors: FieldErrors = {};
  const name = (fields.full_name ?? "").trim();
  if (!name) errors.full_name = "Informe seu nome completo.";
  else if (name.length > 200) errors.full_name = "Nome muito longo.";
  if (!validateCpf(fields.cpf ?? "")) errors.cpf = "CPF inválido.";
  if (!isValidCrmvState((fields.crmv_state ?? "").trim().toUpperCase()))
    errors.crmv_state = "Selecione o estado do CRMV.";
  if (!isValidCrmv(fields.crmv ?? "")) errors.crmv = "Número de CRMV inválido.";
  return errors;
}

export function firstFieldError(errors: FieldErrors): { field: AccountField; error: string } | null {
  const field = (Object.keys(errors) as AccountField[])[0];
  return field ? { field, error: errors[field]! } : null;
}
