import { createMinerDependencies } from "../src/miner/http.js";

const dependencies = process.env.VERIDEX_RPC_URL ? createMinerDependencies() : null;

export default async function handler(req: { method?: string; body?: unknown }, res: { statusCode?: number; setHeader(name: string, value: string): void; end(body?: string): void }): Promise<void> {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  if (!dependencies) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "analysis_unavailable", reason: "rpc_not_configured" }));
    return;
  }

  const input = req.body as Record<string, unknown> | undefined;
  if (!input || typeof input.chain !== "string" || typeof input.contractAddress !== "string") {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "invalid_request", detail: "Expected chain and contractAddress" }));
    return;
  }

  try {
    const result = await dependencies.analyze({
      chain: input.chain,
      contractAddress: input.contractAddress,
      ...(typeof input.codeAddress === "string" ? { codeAddress: input.codeAddress } : {}),
    });
    res.statusCode = 200;
    res.end(JSON.stringify({ schema: "veridex.miner.v1", result }));
  } catch (error) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "analysis_unavailable", detail: error instanceof Error ? error.message : String(error) }));
  }
}
