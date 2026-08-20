import { describe, expect, it } from "vitest";
import { addClassification, createConfusionCounts } from "../../src/evaluation/confusion.js";

describe("ground-truth confusion aggregation", () => {
  it("maps snake-case classifications to report metric keys", () => {
    const counts = createConfusionCounts();
    for (const classification of [
      "true_positive",
      "true_negative",
      "false_positive",
      "false_negative",
      "inconclusive",
      "unavailable",
      "error",
    ]) {
      addClassification(counts, classification);
    }

    expect(counts).toEqual({
      truePositive: 1,
      trueNegative: 1,
      falsePositive: 1,
      falseNegative: 1,
      inconclusive: 1,
      unavailable: 1,
      error: 1,
      total: 7,
    });
  });
});
