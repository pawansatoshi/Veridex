import { minerDependencies } from "../src/miner/runtime.js";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

export default async function handler(req: { method?: string; body?: unknown }, res: { statusCode?: number; setHeader(name: string, value: string): void; end(body?: string): void }): Promise<void> {
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: "method_not_allowed" }));
    return;
  }

  const input = req.body as Record<string, unknown> | undefined;
  if (!input || input.chain !== "1" || typeof input.contractAddress !== "string" || !ADDRESS_RE.test(input.contractAddress)) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "invalid_request", detail: "Expected Ethereum mainnet chain=1 and a valid contractAddress" }));
    return;
  }

  try {
    const result = await minerDependencies.analyze({ chain: "1", contractAddress: input.contractAddress });
    res.statusCode = 200;
    res.end(JSON.stringify({ schema: "veridex.miner.v1", result }));
  } catch (error) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: "analysis_unavailable", detail: error instanceof Error ? error.message : String(error) }));
  }
}
