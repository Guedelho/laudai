import { describe, expect, it } from "vitest";
import { chatUsageCostNanoUsd } from "./usage";
import { CHAT_DAILY_BUDGET_NANO_USD } from "@/shared/constants";

describe("chatUsageCostNanoUsd", () => {
  it("prices input at 1500 and output at 9000 nano-USD per token", () => {
    expect(chatUsageCostNanoUsd(1, 0)).toBe(1500);
    expect(chatUsageCostNanoUsd(0, 1)).toBe(9000);
    expect(chatUsageCostNanoUsd(1_000_000, 1_000_000)).toBe(1_500_000_000 + 9_000_000_000);
  });

  it("is zero with no tokens", () => {
    expect(chatUsageCostNanoUsd(0, 0)).toBe(0);
  });

  it("weights output 6x input", () => {
    expect(chatUsageCostNanoUsd(0, 1)).toBe(chatUsageCostNanoUsd(6, 0));
  });

  it("crosses the daily budget at the documented token volumes", () => {
    // $0.20/day budget. 133,334 input tokens (> $0.20) reaches it; 133,333 stays under.
    expect(chatUsageCostNanoUsd(133_334, 0)).toBeGreaterThanOrEqual(CHAT_DAILY_BUDGET_NANO_USD);
    expect(chatUsageCostNanoUsd(133_333, 0)).toBeLessThan(CHAT_DAILY_BUDGET_NANO_USD);
  });
});
