import type { NormalizedAnalysis } from "../domain/analyzer.js";

export type GroundTruthExpected = "positive" | "negative";

export interface GroundTruthCase {
  id: string;
  description: string;
  expected: Partial<Record<"ownership" | "upgradeability" | "pause" | "mint", GroundTruthExpected>>;
}

export interface GroundTruthMetrics {
  totalChecks: number;
  evaluatedChecks: number;
  truePositive: number;
  trueNegative: number;
  falsePositive: number;
  falseNegative: number;
  inconclusive: number;
  unavailable: number;
  error: number;
  accuracy: number;
}

export function evaluateGroundTruth(
  cases: readonly GroundTruthCase[],
  results: ReadonlyMap<string, NormalizedAnalysis>,
): GroundTruthMetrics {
  let totalChecks = 0;
  let evaluatedChecks = 0;
  let truePositive = 0;
  let trueNegative = 0;
  let falsePositive = 0;
  let falseNegative = 0;
  let inconclusive = 0;
  let unavailable = 0;
  let error = 0;

  for (const testCase of cases) {
    const result = results.get(testCase.id);
    if (!result) throw new Error(`Missing ground-truth result: ${testCase.id}`);

    for (const [capability, expected] of Object.entries(testCase.expected) as [keyof GroundTruthCase["expected"], GroundTruthExpected][]) {
      totalChecks += 1;
      const observation = result.capabilities.find((item) => item.capability === capability);
      if (!observation) throw new Error(`Missing capability result '${capability}' for ${testCase.id}`);

      if (observation.result === "inconclusive") {
        inconclusive += 1;
        continue;
      }
      if (observation.result === "unavailable") {
        unavailable += 1;
        continue;
      }
      if (observation.result === "error") {
        error += 1;
        continue;
      }

      evaluatedChecks += 1;
      if (expected === "positive" && observation.result === "positive") truePositive += 1;
      else if (expected === "negative" && observation.result === "negative") trueNegative += 1;
      else if (expected === "positive") falseNegative += 1;
      else falsePositive += 1;
    }
  }

  return {
    totalChecks,
    evaluatedChecks,
    truePositive,
    trueNegative,
    falsePositive,
    falseNegative,
    inconclusive,
    unavailable,
    error,
    accuracy: evaluatedChecks === 0 ? 0 : (truePositive + trueNegative) / evaluatedChecks,
  };
}

export const H1_GROUND_TRUTH_CASES: readonly GroundTruthCase[] = [
  {
    id: "ownable-pausable-mintable-direct",
    description: "Verified direct contract exposing ownership, pause control and mint entry point",
    expected: { ownership: "positive", upgradeability: "negative", pause: "positive", mint: "positive" },
  },
  {
    id: "non-ownable-non-pausable-non-mintable-direct",
    description: "Verified direct contract without the H1 control capabilities",
    expected: { ownership: "negative", upgradeability: "negative", pause: "negative", mint: "negative" },
  },
  {
    id: "upgradeable-proxy",
    description: "EIP-1967 proxy with a separately resolved implementation",
    expected: { ownership: "positive", upgradeability: "positive", pause: "positive", mint: "negative" },
  },
  {
    id: "selector-collision-adversarial",
    description: "Unverified bytecode containing known selectors only as ambiguous fallback evidence",
    expected: { pause: "positive", mint: "positive" },
  },
];
