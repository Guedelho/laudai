import { describe, it, expect } from "vitest";
import { normalizeCrmv, isValidCrmv, isValidCrmvState } from "@/lib/crmv";

describe("normalizeCrmv", () => {
  it("uppercases and strips whitespace", () => {
    expect(normalizeCrmv(" crmv 12345 ")).toBe("CRMV12345");
    expect(normalizeCrmv("12345")).toBe("12345");
  });
});

describe("isValidCrmv", () => {
  it("requires at least one digit and length 1-20", () => {
    expect(isValidCrmv("12345")).toBe(true);
    expect(isValidCrmv("crmv 12345")).toBe(true);
    expect(isValidCrmv("ABCDE")).toBe(false);
    expect(isValidCrmv("")).toBe(false);
    expect(isValidCrmv("1".repeat(21))).toBe(false);
  });
});

describe("isValidCrmvState", () => {
  it("accepts only the 27 UF codes (uppercase)", () => {
    expect(isValidCrmvState("SP")).toBe(true);
    expect(isValidCrmvState("DF")).toBe(true);
    expect(isValidCrmvState("sp")).toBe(false);
    expect(isValidCrmvState("XX")).toBe(false);
    expect(isValidCrmvState("")).toBe(false);
  });
});
