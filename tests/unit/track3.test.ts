import { describe, expect, it } from "vitest";
import type { NormalizedAnalysis } from "../../src/domain/analyzer.js";
import { buildReviewQuery, decide, extractReview } from "../../src/application/track3.js";

function analysis(overrides: Partial<NormalizedAnalysis> = {}): NormalizedAnalysis {
  return {
    contract: {
      chain: "1",
      contractAddress: "0x0000000000000000000000000000000000000001",
      codeAddress: "0x0000000000000000000000000000000000000001",
      hasCode: true,
    },
    capabilities: [],
    conclusive: true,
    confidence: 0.91,
    evidence: [],
    ...overrides,
  } as NormalizedAnalysis;
}

describe("Track 3 review parsing", () => {
  it("accepts the strict structured review contract", () => {
    expect(extractReview({
      assessment: "supports",
      riskLevel: "medium",
      confidence: 0.82,
      reasons: ["The supplied observations are internally consistent."],
    })).toEqual({
      assessment: "supports",
      riskLevel: "medium",
      confidence: 0.82,
      reasons: ["The supplied observations are internally consistent."],
    });
  });

  it("parses JSON returned as a fenced string", () => {
    const review = extractReview('```json\n{"assessment":"contradicts","riskLevel":"high","confidence":0.7,"reasons":["Conflict"]}\n```');
    expect(review.assessment).toBe("contradicts");
    expect(review.riskLevel).toBe("high");
    expect(review.confidence).toBe(0.7);
  });

  it("never treats unstructured provider output as a security conclusion", () => {
    const review = extractReview("You should probably avoid this contract.");
    expect(review.assessment).toBe("invalid");
    expect(review.riskLevel).toBe("unknown");
    expect(review.confidence).toBeNull();
  });
});

describe("Track 3 decisions", () => {
  it("preserves deterministic-only state when Telegraph is unavailable", () => {
    expect(decide(analysis(), { assessment: "supports", riskLevel: "unknown", confidence: null, reasons: [] }, false).status).toBe("DETERMINISTIC_ONLY");
  });

  it("surfaces a conflict instead of flattening it", () => {
    const result = decide(analysis(), { assessment: "contradicts", riskLevel: "high", confidence: 0.8, reasons: ["Conflict"] }, true);
    expect(result.status).toBe("CONFLICTED");
  });

  it("requires deterministic evidence before calling a supporting review corroboration", () => {
    const result = decide(
      analysis({ conclusive: false, confidence: 0.63 }),
      { assessment: "supports", riskLevel: "medium", confidence: 0.8, reasons: ["Supports"] },
      true,
    );
    expect(result.status).toBe("INCONCLUSIVE");
  });
});

describe("Track 3 query boundary", () => {
  it("includes structured observations without asking Telegraph to invent chain facts", () => {
    const { query, context } = buildReviewQuery(analysis());
    expect(query).toContain("Do not invent balances, owners, source-code facts, transactions");
    expect(JSON.stringify(context)).toContain("deterministicState");
    expect(JSON.stringify(context)).toContain("0x0000000000000000000000000000000000000001");
  });
});
