import { describe, expect, it } from "vitest";
import { LatencyTracker } from "../../src/infrastructure/metrics.js";

describe("latency tracker", () => {
  it("reports bounded percentile snapshots", () => {
    const tracker = new LatencyTracker(10);
    for (let index = 1; index <= 10; index += 1) tracker.observe(index);

    expect(tracker.snapshot()).toEqual({ count: 10, p50Ms: 5, p95Ms: 9, p99Ms: 10 });
  });

  it("bounds memory by retaining only the newest samples", () => {
    const tracker = new LatencyTracker(10);
    for (let index = 1; index <= 20; index += 1) tracker.observe(index);

    expect(tracker.snapshot().count).toBe(10);
    expect(tracker.snapshot().p50Ms).toBe(15);
  });
});
