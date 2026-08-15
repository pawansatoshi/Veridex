import { request } from "node:http";
import { describe, expect, it } from "vitest";
import { AnalysisCache } from "../infrastructure/cache.js";
import { LatencyTracker } from "../infrastructure/metrics.js";
import { createMinerServer } from "./http.js";
import type { NormalizedAnalysis } from "../domain/analyzer.js";

const ADDRESS = "0x0000000000000000000000000000000000000001";

function get(server: ReturnType<typeof createMinerServer>, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const address = server.address();
    if (!address || typeof address === "string") return reject(new Error("server did not bind"));
    const req = request({ hostname: "127.0.0.1", port: address.port, path, method: "GET" }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    req.end();
  });
}

function post(server: ReturnType<typeof createMinerServer>, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const address = server.address();
    if (!address || typeof address === "string") return reject(new Error("server did not bind"));
    const req = request({ hostname: "127.0.0.1", port: address.port, path: "/analyze", method: "POST", headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) } }, (response) => {
      const chunks: Buffer[] = [];
      response.on("data", (chunk: Buffer) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString("utf8") }));
    });
    req.on("error", reject);
    req.end(body);
  });
}

function dependencies(analysis: NormalizedAnalysis = fixtureAnalysis()) {
  return {
    latency: new LatencyTracker(),
    cache: new AnalysisCache<NormalizedAnalysis>({ ttlMs: 15_000, maxEntries: 8 }),
    analyze: async () => analysis,
  };
}

function fixtureAnalysis(): NormalizedAnalysis {
  return {
    contract: { requestedAddress: ADDRESS, contractAddress: ADDRESS, chain: "1" },
    proxy: {
      contractAddress: ADDRESS,
      status: "direct",
      evidence: {
        implementationSlot: "0ximplementation",
        beaconSlot: "0xbeacon",
        adminSlot: "0xadmin",
      },
    },
    verification: {
      status: "verified",
      contractAddress: ADDRESS,
      verified: true,
      abiAvailable: true,
      sourceAvailable: true,
      abi: [],
      provenance: "verified_abi",
    },
    capabilities: [
      { capability: "ownership", result: "negative", evidence: { contractAddress: ADDRESS }, detectionMethod: "direct_onchain", confidence: 1, conclusive: true },
      { capability: "upgradeability", result: "negative", evidence: { contractAddress: ADDRESS }, detectionMethod: "direct_onchain", confidence: 1, conclusive: true },
      { capability: "pause", result: "negative", evidence: { contractAddress: ADDRESS }, detectionMethod: "bytecode_fallback", confidence: 1, conclusive: true },
      { capability: "mint", result: "negative", evidence: { contractAddress: ADDRESS }, detectionMethod: "bytecode_fallback", confidence: 1, conclusive: true },
    ],
    evidence: [],
    confidence: 1,
    conclusive: true,
    providerStatus: { verification: "verified", rpc: "ok" },
  };
}

describe("Miner HTTP bridge", () => {
  it("serves health and metrics without an RPC dependency", async () => {
    const server = createMinerServer(dependencies());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    try {
      const health = await get(server, "/health");
      expect(health.status).toBe(200);
      expect(JSON.parse(health.body).ok).toBe(true);
      const metrics = await get(server, "/metrics");
      expect(metrics.status).toBe(200);
      expect(JSON.parse(metrics.body).latency.count).toBe(0);
      expect(JSON.parse(metrics.body).cache.entries).toBe(0);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("rejects malformed Miner requests before analysis", async () => {
    const server = createMinerServer(dependencies());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    try {
      const result = await post(server, JSON.stringify({ chain: "1", contractAddress: "not-an-address" }));
      expect(result.status).toBe(400);
      expect(JSON.parse(result.body).error).toBe("invalid_request");
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  it("returns the production-compatible response envelope", async () => {
    const analysis = fixtureAnalysis();
    const server = createMinerServer(dependencies(analysis));
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    try {
      const result = await post(server, JSON.stringify({ chain: "ethereum", contractAddress: ADDRESS }));
      expect(result.status).toBe(200);
      const body = JSON.parse(result.body) as Record<string, unknown>;
      expect(body.schema).toBe("veridex.miner.v1");
      expect(body.result).toEqual(analysis);
      expect(body.capabilityIntelligence).toMatchObject({
        subject: analysis.contract,
        state: "established",
        confidence: 1,
      });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });
});
