import { describe, it, expect } from "vitest";
import { normalizeAccount, validateAccountFields, firstFieldError } from "@/lib/account";

const valid = { full_name: "Dra. Tatiana", cpf: "111.444.777-35", crmv: "12345", crmv_state: "SP" };

describe("normalizeAccount", () => {
  it("trims name, reduces cpf/crmv to canonical form, uppercases UF", () => {
    expect(
      normalizeAccount({ full_name: "  Tatiana  ", cpf: "111.444.777-35", crmv: " crmv 9 ", crmv_state: "sp" }),
    ).toEqual({ full_name: "Tatiana", cpf: "11144477735", crmv: "CRMV9", crmv_state: "SP" });
  });
  it("coerces missing fields to empty strings", () => {
    expect(normalizeAccount({} as never)).toEqual({ full_name: "", cpf: "", crmv: "", crmv_state: "" });
  });
});

describe("validateAccountFields", () => {
  it("returns no errors for a valid account", () => {
    expect(validateAccountFields(valid)).toEqual({});
  });
  it("flags each invalid field", () => {
    expect(validateAccountFields({ ...valid, full_name: "" }).full_name).toBeDefined();
    expect(validateAccountFields({ ...valid, full_name: "a".repeat(201) }).full_name).toBeDefined();
    expect(validateAccountFields({ ...valid, cpf: "123" }).cpf).toBeDefined();
    expect(validateAccountFields({ ...valid, crmv_state: "XX" }).crmv_state).toBeDefined();
    expect(validateAccountFields({ ...valid, crmv: "abc" }).crmv).toBeDefined();
  });
  it("accepts a lowercase UF (normalized before lookup)", () => {
    expect(validateAccountFields({ ...valid, crmv_state: "sp" })).toEqual({});
  });
});

describe("firstFieldError", () => {
  it("returns the first error or null", () => {
    expect(firstFieldError({})).toBeNull();
    expect(firstFieldError({ cpf: "CPF inválido." })).toEqual({ field: "cpf", error: "CPF inválido." });
  });
});
