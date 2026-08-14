import { describe, expect, it } from "vitest";
import { AnalysisCache } from "../../src/infrastructure/cache.js";

describe("analysis cache", () => {
  it("coalesces concurrent requests and caches successful results", async () => {
    let now = 1_000;
    let calls = 0;
    const cache = new AnalysisCache<string>({ ttlMs: 100, maxEntries: 2, now: () => now });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const compute = async () => {
      calls += 1;
      await gate;
      return "analysis";
    };

    const first = cache.getOrCompute("ethereum:0x1:", compute);
    const second = cache.getOrCompute("ethereum:0x1:", compute);
    release();

    await expect(Promise.all([first, second])).resolves.toEqual(["analysis", "analysis"]);
    expect(calls).toBe(1);
    expect(cache.snapshot().coalesced).toBe(1);

    await expect(cache.getOrCompute("ethereum:0x1:", compute)).resolves.toBe("analysis");
    expect(calls).toBe(1);
    expect(cache.snapshot().hits).toBe(1);

    now += 101;
    await expect(cache.getOrCompute("ethereum:0x1:", compute)).resolves.toBe("analysis");
    expect(calls).toBe(2);
  });

  it("never caches failures", async () => {
    let calls = 0;
    const cache = new AnalysisCache<string>({ ttlMs: 100, maxEntries: 2 });
    const compute = async () => {
      calls += 1;
      throw new Error("provider unavailable");
    };

    await expect(cache.getOrCompute("k", compute)).rejects.toThrow("provider unavailable");
    await expect(cache.getOrCompute("k", compute)).rejects.toThrow("provider unavailable");
    expect(calls).toBe(2);
    expect(cache.snapshot().entries).toBe(0);
  });
});
