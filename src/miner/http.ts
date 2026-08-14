import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { NormalizedAnalysis } from "../domain/analyzer.js";
import { analyzeContract } from "../domain/analyzer.js";
import { loadRuntimeConfig } from "../infrastructure/config.js";
import { LatencyTracker, measureAsync } from "../infrastructure/metrics.js";
import { JsonRpcClient } from "../infrastructure/rpc.js";
import { SourcifyVerificationProvider } from "../infrastructure/sourcify.js";
import { NotConfiguredVerificationProvider, VerificationClient } from "../infrastructure/verification.js";

const MAX_BODY_BYTES = 64 * 1024;
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export interface MinerRequest {
  chain: string;
  contractAddress: string;
  codeAddress?: string;
}

export interface MinerDependencies {
  analyze: (request: MinerRequest) => Promise<NormalizedAnalysis>;
  latency: LatencyTracker;
}

function json(response: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.setHeader("cache-control", "no-store");
  response.end(body);
}

function validRequest(value: unknown): value is MinerRequest {
  if (typeof value !== "object" || value === null) return false;
  const input = value as Record<string, unknown>;
  if (typeof input.chain !== "string" || input.chain.trim().length === 0 || input.chain.length > 64) return false;
  if (typeof input.contractAddress !== "string" || !ADDRESS_RE.test(input.contractAddress)) return false;
  if (input.codeAddress !== undefined && (typeof input.codeAddress !== "string" || !ADDRESS_RE.test(input.codeAddress))) return false;
  return true;
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
  const provider = env.VERIDEX_SOURCIFY_CHAIN_ID && /^\d+$/.test(env.VERIDEX_SOURCIFY_CHAIN_ID)
    ? new SourcifyVerificationProvider({ chainId: env.VERIDEX_SOURCIFY_CHAIN_ID })
    : new NotConfiguredVerificationProvider();
  const verification = new VerificationClient(provider, config.rpcTimeoutMs);
  const latency = new LatencyTracker();

  return {
    latency,
    analyze: (request) => measureAsync(latency, () => analyzeContract({ rpc, verification }, request)),
  };
}

export function createMinerServer(dependencies: MinerDependencies): ReturnType<typeof createServer> {
  return createServer(async (request, response) => {
    try {
      if (request.method === "GET" && request.url === "/health") {
        json(response, 200, { ok: true, service: "veridex-miner", version: "0.1.0" });
        return;
      }

      if (request.method === "GET" && request.url === "/metrics") {
        json(response, 200, { latency: dependencies.latency.snapshot() });
        return;
      }

      if (request.method !== "POST" || request.url !== "/analyze") {
        json(response, 404, { error: "not_found" });
        return;
      }

      const input = await readJson(request);
      if (!validRequest(input)) {
        json(response, 400, { error: "invalid_request", detail: "Expected chain, contractAddress and optional codeAddress" });
        return;
      }

      const analysis = await dependencies.analyze(input);
      json(response, 200, {
        schema: "veridex.miner.v1",
        result: analysis,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const status = message.includes("body") || message.includes("request") ? 400 : 503;
      json(response, status, { error: status === 400 ? "invalid_request" : "analysis_unavailable", detail: message });
    }
  });
}
