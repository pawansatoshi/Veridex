import { request } from "node:http";
import { describe, expect, it } from "vitest";
import { AnalysisCache } from "../infrastructure/cache.js";
import { LatencyTracker } from "../infrastructure/metrics.js";
import { createMinerServer } from "./http.js";
import type { NormalizedAnalysis } from "../domain/analyzer.js";

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

function dependencies() {
  return {
    latency: new LatencyTracker(),
    cache: new AnalysisCache<NormalizedAnalysis>({ ttlMs: 15_000, maxEntries: 8 }),
    analyze: async () => { throw new Error("not called"); },
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
});
