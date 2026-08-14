import { describe, expect, it } from "vitest";
import { buildCapabilityIntelligence, diffCapabilities } from "../../src/domain/capabilityIntelligence.js";
import type { NormalizedAnalysis } from "../../src/domain/analyzer.js";

function analysis(overrides: Partial<NormalizedAnalysis["capabilities"][number]> = {}): NormalizedAnalysis {
  return {
    contract: { requestedAddress: "0x0000000000000000000000000000000000000001", contractAddress: "0x0000000000000000000000000000000000000001", chain: "ethereum" },
    proxy: { contractAddress: "0x0000000000000000000000000000000000000001", codeAddress: "0x0000000000000000000000000000000000000001", status: "direct", evidence: {} },
    verification: { status: "verified", abiAvailable: true, sourceAvailable: true },
    capabilities: [
      { capability: "mint", result: "negative", evidence: { source: "verified_abi" }, detectionMethod: "verified_abi", confidence: 1, conclusive: true, ...overrides },
    ],
    evidence: [], confidence: overrides.confidence ?? 1, conclusive: overrides.conclusive ?? true,
    providerStatus: { verification: "verified", rpc: "ok" },
  };
}

describe("capability intelligence", () => {
  it("builds an evidence-backed capability map", () => {
    const result = buildCapabilityIntelligence(analysis({ result: "positive", evidence: { authority: "MINTER_ROLE" } }));
    expect(result.state).toBe("established");
    expect(result.capabilityMap[0]).toMatchObject({ capability: "mint", result: "positive", authority: "MINTER_ROLE" });
    expect(result.evidenceGraph[0]).toMatchObject({ capability: "mint", authority: "MINTER_ROLE" });
  });

  it("detects a capability being added", () => {
    const before = analysis();
    const after = analysis({ result: "positive", evidence: { authority: "MINTER_ROLE" } });
    const diff = diffCapabilities(before, after);
    expect(diff.changed).toBe(true);
    expect(diff.changes).toEqual([expect.objectContaining({ capability: "mint", before: "negative", after: "positive", change: "added" })]);
    expect(diff.conclusive).toBe(true);
  });

  it("does not create a conclusive change from inconclusive evidence", () => {
    const before = analysis({ result: "inconclusive", confidence: 0.5, conclusive: false });
    const after = analysis({ result: "positive" });
    const diff = diffCapabilities(before, after);
    expect(diff.changed).toBe(true);
    expect(diff.conclusive).toBe(false);
  });
});
