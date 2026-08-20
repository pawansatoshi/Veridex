import { describe, expect, it } from "vitest";
import { buildCapabilityPassport, passportIdentityKey } from "../../src/domain/capabilityPassport.js";
import type { NormalizedAnalysis } from "../../src/domain/analyzer.js";

const analysis = (overrides: Partial<NormalizedAnalysis> = {}): NormalizedAnalysis => ({
  contract: {
    requestedAddress: "0x1111111111111111111111111111111111111111",
    contractAddress: "0x1111111111111111111111111111111111111111",
    chain: "ethereum",
  },
  proxy: {
    contractAddress: "0x1111111111111111111111111111111111111111",
    status: "direct",
    evidence: { method: "none" },
  } as NormalizedAnalysis["proxy"],
  verification: {
    status: "verified",
    abiAvailable: true,
    abi: [],
  } as NormalizedAnalysis["verification"],
  capabilities: [
    {
      capability: "ownership",
      result: "positive",
      evidence: { ownerAddress: "0x2222222222222222222222222222222222222222" },
      detectionMethod: "direct_onchain",
      confidence: 1,
      conclusive: true,
    },
    {
      capability: "upgradeability",
      result: "negative",
      evidence: { status: "direct" },
      detectionMethod: "direct_onchain",
      confidence: 1,
      conclusive: true,
    },
  ],
  evidence: [],
  confidence: 1,
  conclusive: true,
  providerStatus: { verification: "verified", rpc: "ok" },
  ...overrides,
});

describe("capability passport", () => {
  it("creates a stable subject identity independent of observation time", () => {
    const first = buildCapabilityPassport(analysis(), "2026-08-20T00:00:00.000Z");
    const second = buildCapabilityPassport(analysis(), "2026-08-21T00:00:00.000Z");

    expect(first.identity.passportId).toBe(second.identity.passportId);
    expect(first.identity.evidenceFingerprint).toBe(second.identity.evidenceFingerprint);
    expect(first.identity.observedAt).not.toBe(second.identity.observedAt);
    expect(passportIdentityKey(first)).toBe(passportIdentityKey(second));
  });

  it("changes the evidence fingerprint when observed evidence changes", () => {
    const first = buildCapabilityPassport(analysis(), "2026-08-20T00:00:00.000Z");
    const second = buildCapabilityPassport(analysis({
      capabilities: [
        {
          capability: "ownership",
          result: "positive",
          evidence: { ownerAddress: "0x3333333333333333333333333333333333333333" },
          detectionMethod: "direct_onchain",
          confidence: 1,
          conclusive: true,
        },
      ],
    }), "2026-08-20T00:01:00.000Z");

    expect(first.identity.passportId).toBe(second.identity.passportId);
    expect(first.identity.evidenceFingerprint).not.toBe(second.identity.evidenceFingerprint);
  });

  it("does not claim an established posture from inconclusive evidence", () => {
    const passport = buildCapabilityPassport(analysis({
      conclusive: false,
      confidence: 0.5,
      capabilities: [{
        capability: "mint",
        result: "inconclusive",
        evidence: { reason: "unverified" },
        detectionMethod: "bytecode_fallback",
        confidence: 0.5,
        conclusive: false,
      }],
    }), "2026-08-20T00:00:00.000Z");

    expect(passport.posture.state).toBe("inconclusive");
    expect(passport.posture.conclusive).toBe(false);
  });
});
