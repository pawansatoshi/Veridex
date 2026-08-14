import { describe, expect, it } from "vitest";
import { evaluateGroundTruth, type GroundTruthCase } from "../../src/evaluation/ground-truth.js";
import type { NormalizedAnalysis } from "../../src/domain/analyzer.js";

function resultFor(caseId: string, capabilities: NormalizedAnalysis["capabilities"]): NormalizedAnalysis {
  return {
    contract: { requestedAddress: "0x0000000000000000000000000000000000000001", contractAddress: "0x0000000000000000000000000000000000000001", chain: "ethereum" },
    proxy: {
      contractAddress: "0x0000000000000000000000000000000000000001",
      status: "direct",
      evidence: { implementationSlot: "0x", beaconSlot: "0x", adminSlot: "0x" },
    },
    verification: {
      status: "verified",
      contractAddress: "0x0000000000000000000000000000000000000001",
      verified: true,
      abiAvailable: true,
      sourceAvailable: true,
      provenance: "verified_abi",
    },
    capabilities,
    evidence: [],
    confidence: 1,
    conclusive: true,
    providerStatus: { verification: "verified", rpc: "ok" },
  };
}

describe("ground-truth evaluation", () => {
  it("separates correct, incorrect and inconclusive observations", () => {
    const cases: GroundTruthCase[] = [
      { id: "case", description: "fixture", expected: { pause: "positive", mint: "negative" } },
    ];
    const results = new Map([
      ["case", resultFor("case", [
        { capability: "pause", result: "positive", evidence: {}, detectionMethod: "verified_abi", confidence: 1, conclusive: true },
        { capability: "mint", result: "inconclusive", evidence: {}, detectionMethod: "bytecode_fallback", confidence: 0.5, conclusive: false },
      ])],
    ]);

    const metrics = evaluateGroundTruth(cases, results);

    expect(metrics.totalChecks).toBe(2);
    expect(metrics.truePositive).toBe(1);
    expect(metrics.inconclusive).toBe(1);
    expect(metrics.falsePositive).toBe(0);
    expect(metrics.falseNegative).toBe(0);
    expect(metrics.accuracy).toBe(1);
  });
});
