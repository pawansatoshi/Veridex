import { describe, expect, it } from "vitest";

describe("Miner evaluation contract", () => {
  it("uses explicit quality dimensions and never presents the score as official ranking", async () => {
    const source = await (await import("node:fs/promises")).readFile("scripts/evaluate-miner.mjs", "utf8");
    expect(source).toContain("internal-quality-gate");
    expect(source).toContain("does not represent an official Telegraph ranking");
    expect(source).toContain("falsePositive");
    expect(source).toContain("falseNegative");
    expect(source).toContain("evidenceCoverage");
  });
});
