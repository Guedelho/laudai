import { describe, it, expect } from "vitest";
import { normalizeCpf, formatCpf, validateCpf } from "@/lib/cpf";

describe("normalizeCpf", () => {
  it("strips non-digits", () => {
    expect(normalizeCpf("111.444.777-35")).toBe("11144477735");
    expect(normalizeCpf("  111 444 777 35 ")).toBe("11144477735");
  });
});

describe("formatCpf", () => {
  it("masks digits and caps at 11", () => {
    expect(formatCpf("11144477735")).toBe("111.444.777-35");
    expect(formatCpf("111444777359999")).toBe("111.444.777-35");
  });
  it("handles partial input", () => {
    expect(formatCpf("111")).toBe("111");
    expect(formatCpf("1114")).toBe("111.4");
  });
});

describe("validateCpf", () => {
  it("accepts valid CPFs (masked or raw)", () => {
    expect(validateCpf("111.444.777-35")).toBe(true);
    expect(validateCpf("11144477735")).toBe(true);
    expect(validateCpf("529.982.247-25")).toBe(true);
  });
  it("rejects bad checksums, repeated digits, and wrong length", () => {
    expect(validateCpf("111.444.777-00")).toBe(false);
    expect(validateCpf("111.111.111-11")).toBe(false);
    expect(validateCpf("123456789")).toBe(false);
    expect(validateCpf("")).toBe(false);
  });
});
