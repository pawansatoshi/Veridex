import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { buildCapabilityIntelligence } from "../domain/capabilityIntelligence.js";
import type { NormalizedAnalysis } from "../domain/analyzer.js";
import { analyzeContract } from "../domain/analyzer.js";
import { AnalysisCache } from "../infrastructure/cache.js";
import { loadRuntimeConfig } from "../infrastructure/config.js";
import { LatencyTracker, measureAsync } from "../infrastructure/metrics.js";
import { JsonRpcClient } from "../infrastructure/rpc.js";
import { runResilienceSelfTest } from "../infrastructure/resilience.js";
import { SourcifyVerificationProvider } from "../infrastructure/sourcify.js";
import { NotConfiguredVerificationProvider, VerificationClient } from "../infrastructure/verification.js";
import { normalizeMinerRequest } from "./request.js";
import type { MinerRequest } from "./request.js";

const MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_SOURCIFY_CHAIN_ID = "1";
const DEFAULT_CACHE_TTL_MS = 15_000;
const DEFAULT_CACHE_MAX_ENTRIES = 256;

export type { MinerRequest } from "./request.js";

export interface MinerDependencies {
  analyze: (request: MinerRequest) => Promise<NormalizedAnalysis>;
  latency: LatencyTracker;
  cache: AnalysisCache<NormalizedAnalysis>;
}

function json(response: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(body);
}

function boundedEnvInteger(name: string, value: string | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value)) throw new Error(`Invalid ${name}: expected an integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid ${name}: expected integer in [${min}, ${max}]`);
  }
  return parsed;
}

function cacheKey(request: MinerRequest): string {
  return [
    request.chain.trim().toLowerCase(),
    request.contractAddress.toLowerCase(),
    request.codeAddress?.toLowerCase() ?? "",
  ].join(":");
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("request body exceeds 64 KiB");
    chunks.push(buffer);
  }
  if (size === 0) throw new Error("request body is required");
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new Error("request body is not valid JSON");
  }
}

export function createMinerDependencies(env: Record<string, string | undefined> = process.env): MinerDependencies {
  const config = loadRuntimeConfig(env);
  const rpc = new JsonRpcClient(config);
  const sourcifyChainId = env.VERIDEX_SOURCIFY_CHAIN_ID ?? DEFAULT_SOURCIFY_CHAIN_ID;
  const provider = /^\d+$/.test(sourcifyChainId)
    ? new SourcifyVerificationProvider({
        chainId: sourcifyChainId,
        ...(env.VERIDEX_SOURCIFY_BASE_URL ? { baseUrl: env.VERIDEX_SOURCIFY_BASE_URL } : {}),
      })
    : new NotConfiguredVerificationProvider();
  const verification = new VerificationClient(provider, config.rpcTimeoutMs);
  const latency = new LatencyTracker();
  const cache = new AnalysisCache<NormalizedAnalysis>({
    ttlMs: boundedEnvInteger("VERIDEX_CACHE_TTL_MS", env.VERIDEX_CACHE_TTL_MS, DEFAULT_CACHE_TTL_MS, 0, 300_000),
    maxEntries: boundedEnvInteger("VERIDEX_CACHE_MAX_ENTRIES", env.VERIDEX_CACHE_MAX_ENTRIES, DEFAULT_CACHE_MAX_ENTRIES, 1, 10_000),
  });

  return {
    latency,
    cache,
    analyze: (request) => cache.getOrCompute(
      cacheKey(request),
      () => measureAsync(latency, () => analyzeContract({ rpc, verification }, request)),
    ),
  };
}

export function createMinerServer(dependencies: MinerDependencies): ReturnType<typeof createServer> {
  return createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/health") {
        json(response, 200, { ok: true, service: "veridex-miner", version: "0.1.0" });
        return;
      }

      if (request.method === "GET" && request.url === "/health/resilience") {
        const result = runResilienceSelfTest();
        json(response, result.valid ? 200 : 503, result);
        return;
      }

      if (request.method === "GET" && request.url === "/metrics") {
        json(response, 200, { latency: dependencies.latency.snapshot(), cache: dependencies.cache.snapshot() });
        return;
      }

      if (request.method !== "POST" || request.url !== "/analyze") {
        json(response, 404, { error: "not_found" });
        return;
      }

      const input = await readJson(request);
      const normalized = normalizeMinerRequest(input);
      if (normalized === undefined) {
        json(response, 400, { error: "invalid_request", detail: "Expected Ethereum mainnet chain (1/ethereum), a valid contractAddress, and optional codeAddress" });
        return;
      }

      const analysis = await dependencies.analyze(normalized);
      json(response, 200, {
        schema: "veridex.miner.v1",
        result: analysis,
        capabilityIntelligence: buildCapabilityIntelligence(analysis),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("body") || message.includes("request") ? 400 : 503;
      json(response, status, { error: status === 400 ? "invalid_request" : "analysis_unavailable", detail: message });
    }
  });
}
