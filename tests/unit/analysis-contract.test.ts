import { describe, expect, it } from "vitest";
import type { CheckResult } from "../../src/types/analysis.js";

describe("CheckResult contract", () => {
  it("supports additive evidence provenance fields", () => {
    const result: CheckResult = {
      checkName: "pause_capability",
      passed: false,
      status: "positive",
      confidence: 1,
      evidence: { capability: "pause", detected: true },
      detectionMethod: "verified_abi",
      fallbackReason: "unverified_contract",
      fallbackDetail: "Verified ABI unavailable; bytecode fallback used.",
    };

    expect(result.detectionMethod).toBe("verified_abi");
    expect(result.fallbackReason).toBe("unverified_contract");
  });

  it("does not require the additive fields", () => {
    const result: CheckResult = {
      checkName: "ownership",
      passed: true,
      status: "negative",
      confidence: 1,
      evidence: {},
    };

    expect(result.detectionMethod).toBeUndefined();
    expect(result.fallbackReason).toBeUndefined();
    expect(result.fallbackDetail).toBeUndefined();
  });
});
