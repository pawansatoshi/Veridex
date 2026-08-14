import { afterEach, describe, expect, it } from "vitest";
import { createMinerServer, type MinerDependencies } from "../../src/miner/http.js";
import { LatencyTracker } from "../../src/infrastructure/metrics.js";
import { AnalysisCache } from "../../src/infrastructure/cache.js";
import type { NormalizedAnalysis } from "../../src/domain/analyzer.js";

const address = "0x0000000000000000000000000000000000000001";

type RunningServer = { url: string; close: () => Promise<void> };

function analysis(): NormalizedAnalysis {
  return {
    contract: { requestedAddress: address, contractAddress: address, chain: "ethereum" },
    proxy: { contractAddress: address, status: "direct", evidence: {} },
    verification: {
      status: "verified",
      contractAddress: address,
      verified: true,
      abiAvailable: true,
      sourceAvailable: true,
      provenance: "verified_abi",
    },
    capabilities: [
      { capability: "ownership", result: "negative", evidence: {}, detectionMethod: "direct_onchain", confidence: 1, conclusive: true },
      { capability: "upgradeability", result: "negative", evidence: {}, detectionMethod: "direct_onchain", confidence: 1, conclusive: true },
      { capability: "pause", result: "negative", evidence: {}, detectionMethod: "verified_abi", confidence: 1, conclusive: true },
      { capability: "mint", result: "negative", evidence: {}, detectionMethod: "verified_abi", confidence: 1, conclusive: true },
    ],
    evidence: [],
    confidence: 1,
    conclusive: true,
    providerStatus: { verification: "verified", rpc: "ok" },
  };
}

async function listen(server: ReturnType<typeof createMinerServer>): Promise<RunningServer> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const addressInfo = server.address();
  if (!addressInfo || typeof addressInfo === "string") throw new Error("server did not bind");
  return {
    url: `http://127.0.0.1:${addressInfo.port}`,
    close: () => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

describe("Miner HTTP failure recovery", () => {
  let running: RunningServer | undefined;

  afterEach(async () => {
    await running?.close();
    running = undefined;
  });

  it("returns unavailable on provider failure, then recovers on the next request", async () => {
    let attempts = 0;
    const dependencies: MinerDependencies = {
      latency: new LatencyTracker(),
      cache: new AnalysisCache({ ttlMs: 0, maxEntries: 8 }),
      analyze: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("provider unavailable");
        return analysis();
      },
    };
    const server = createMinerServer(dependencies);
    running = await listen(server);

    const first = await fetch(`${running.url}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chain: "ethereum", contractAddress: address }),
    });
    expect(first.status).toBe(503);
    expect((await first.json()).error).toBe("analysis_unavailable");

    const second = await fetch(`${running.url}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chain: "ethereum", contractAddress: address }),
    });
    expect(second.status).toBe(200);
    expect((await second.json()).result.conclusive).toBe(true);
    expect(attempts).toBe(2);
  });

  it("rejects malformed requests without touching the analyzer", async () => {
    let calls = 0;
    const dependencies: MinerDependencies = {
      latency: new LatencyTracker(),
      cache: new AnalysisCache({ ttlMs: 0, maxEntries: 8 }),
      analyze: async () => {
        calls += 1;
        return analysis();
      },
    };
    const server = createMinerServer(dependencies);
    running = await listen(server);

    const response = await fetch(`${running.url}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chain: "ethereum", contractAddress: "not-an-address" }),
    });
    expect(response.status).toBe(400);
    expect(calls).toBe(0);
  });
});
