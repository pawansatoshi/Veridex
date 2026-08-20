import { describe, expect, it } from "vitest";
import type { NormalizedAnalysis } from "../../src/domain/analyzer.js";
import { CapabilityWatchScheduler, InMemoryWatchStore, createCapabilityWatch } from "../../src/domain/capabilityWatch.js";

const analysis = (owner: string, overrides: Partial<NormalizedAnalysis> = {}): NormalizedAnalysis => ({
  contract: { requestedAddress: "0x1111111111111111111111111111111111111111", contractAddress: "0x1111111111111111111111111111111111111111", chain: "ethereum" },
  proxy: { contractAddress: "0x1111111111111111111111111111111111111111", status: "direct", evidence: {} } as NormalizedAnalysis["proxy"],
  verification: { status: "verified", abiAvailable: true, abi: [] } as NormalizedAnalysis["verification"],
  capabilities: [
    { capability: "ownership", result: "positive", evidence: { ownerAddress: owner }, detectionMethod: "direct_onchain", confidence: 1, conclusive: true },
    { capability: "upgradeability", result: "negative", evidence: { status: "direct" }, detectionMethod: "direct_onchain", confidence: 1, conclusive: true },
    { capability: "pause", result: "negative", evidence: {}, detectionMethod: "bytecode_fallback", confidence: 1, conclusive: true },
    { capability: "mint", result: "negative", evidence: {}, detectionMethod: "bytecode_fallback", confidence: 1, conclusive: true },
  ],
  evidence: [], confidence: 1, conclusive: true, providerStatus: { verification: "verified", rpc: "ok" }, ...overrides,
});

describe("capability watch", () => {
  it("creates bounded watches with an adaptive schedule", () => {
    const now = new Date("2026-08-20T12:00:00.000Z");
    const watch = createCapabilityWatch("0x1111111111111111111111111111111111111111", "ethereum", { intervalMs: 60_000, minIntervalMs: 30_000, maxIntervalMs: 120_000 }, now);
    expect(watch.status).toBe("active");
    expect(watch.nextDueAt).toBe("2026-08-20T12:01:00.000Z");
    expect(watch.intervalMs).toBe(60_000);
  });

  it("stores a baseline, detects evidenced changes, and emits an alert", async () => {
    const store = new InMemoryWatchStore();
    const watch = createCapabilityWatch("0x1111111111111111111111111111111111111111", "ethereum", { intervalMs: 1_000, minIntervalMs: 1_000, maxIntervalMs: 8_000 }, new Date("2026-08-20T12:00:00.000Z"));
    await store.put({ ...watch, nextDueAt: "2026-08-20T11:59:00.000Z" });
    let owner = "0x2222222222222222222222222222222222222222";
    const alerts: string[] = [];
    const scheduler = new CapabilityWatchScheduler(store, async () => analysis(owner), async (alert) => { alerts.push(alert.whatChanged); }, { now: () => new Date("2026-08-20T12:00:00.000Z") });

    const baseline = await scheduler.tick();
    expect(baseline[0]?.comparison).toBe("baseline");

    owner = "0x3333333333333333333333333333333333333333";
    const current = await store.get(watch.id);
    expect(current).toBeDefined();
    await store.put({ ...current!, nextDueAt: "2026-08-20T11:59:00.000Z" });
    const changed = await scheduler.tick();
    expect(changed[0]?.comparison).toBe("changed");
    expect(changed[0]?.severity).toBe("warning");
    expect(alerts).toHaveLength(1);
  });

  it("treats provider failure as inconclusive rather than a contract change", async () => {
    const store = new InMemoryWatchStore();
    const watch = createCapabilityWatch("0x1111111111111111111111111111111111111111", "ethereum", { intervalMs: 1_000, minIntervalMs: 1_000, maxIntervalMs: 8_000 }, new Date("2026-08-20T12:00:00.000Z"));
    await store.put({ ...watch, nextDueAt: "2026-08-20T11:59:00.000Z" });
    const scheduler = new CapabilityWatchScheduler(store, async () => analysis("0x2222222222222222222222222222222222222222"), undefined, { now: () => new Date("2026-08-20T12:00:00.000Z") });
    await scheduler.tick();
    const current = await store.get(watch.id);
    await store.put({ ...current!, nextDueAt: "2026-08-20T11:59:00.000Z" });
    const failing = new CapabilityWatchScheduler(store, async () => { throw new Error("rpc timeout"); }, undefined, { now: () => new Date("2026-08-20T12:00:00.000Z") });
    const result = await failing.tick();
    expect(result[0]?.comparison).toBe("inconclusive");
    expect(result[0]?.severity).toBe("inconclusive");
  });
});
