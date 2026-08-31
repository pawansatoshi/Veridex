import { buildCapabilityIntelligence } from "../src/domain/capabilityIntelligence.js";
import { buildCapabilityPassport } from "../src/domain/capabilityPassport.js";
import { minerDependencies } from "../src/miner/runtime.js";
import { normalizeMinerRequest } from "../src/miner/request.js";

export default async function handler(req: { method?: string; body?: unknown }, res: { statusCode?: number; setHeader(name: string, value: string): void; end(body?: string): void }): Promise<void> {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  if (req.method !== "POST") { res.statusCode = 405; res.end(JSON.stringify({ error: "method_not_allowed" })); return; }

  const input = normalizeMinerRequest(req.body);
  if (input === undefined) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "invalid_request", detail: "Expected Ethereum mainnet chain (1/ethereum), a valid contractAddress, and optional codeAddress" }));
    return;
  }

  try {
    const result = await minerDependencies.analyze(input);
    res.statusCode = 200;
    res.end(JSON.stringify({
      schema: "veridex.miner.v1",
      result,
      capabilityIntelligence: buildCapabilityIntelligence(result),
      capabilityPassport: buildCapabilityPassport(result),
    }));
  } catch (error) {
    // Keep operational diagnostics in server-side logs/observability. Do not
    // expose RPC/provider/stack details to untrusted callers.
    console.error("veridex analysis unavailable", error);
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "analysis_unavailable", detail: "The analysis service is temporarily unavailable" }));
  }
}
