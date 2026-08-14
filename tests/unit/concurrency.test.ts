import { describe, expect, it } from "vitest";
import { mapBounded } from "../../src/infrastructure/concurrency.js";

describe("bounded concurrency", () => {
  it("preserves input order while bounding active work", async () => {
    let active = 0;
    let peak = 0;
    const result = await mapBounded([1, 2, 3, 4, 5], 2, async (value) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return value * 2;
    });

    expect(result).toEqual([2, 4, 6, 8, 10]);
    expect(peak).toBeLessThanOrEqual(2);
  });
});
