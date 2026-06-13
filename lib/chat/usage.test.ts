import { describe, expect, it } from "vitest";
import { chatUsageCostNanoUsd } from "./usage";
import { CHAT_DAILY_BUDGET_NANO_USD } from "@/shared/constants";

describe("chatUsageCostNanoUsd", () => {
  it("prices input at 500 and output at 3000 nano-USD per token", () => {
    expect(chatUsageCostNanoUsd(1, 0)).toBe(500);
    expect(chatUsageCostNanoUsd(0, 1)).toBe(3000);
    expect(chatUsageCostNanoUsd(1_000_000, 1_000_000)).toBe(500_000_000 + 3_000_000_000);
  });

  it("is zero with no tokens", () => {
    expect(chatUsageCostNanoUsd(0, 0)).toBe(0);
  });

  it("weights output 6x input", () => {
    expect(chatUsageCostNanoUsd(0, 1)).toBe(chatUsageCostNanoUsd(6, 0));
  });

  it("crosses the daily budget at the documented token volumes", () => {
    // $0.20/day budget. 400k input alone ($0.20) reaches it; 399,999 stays under.
    expect(chatUsageCostNanoUsd(400_000, 0)).toBeGreaterThanOrEqual(CHAT_DAILY_BUDGET_NANO_USD);
    expect(chatUsageCostNanoUsd(399_999, 0)).toBeLessThan(CHAT_DAILY_BUDGET_NANO_USD);
  });
});
