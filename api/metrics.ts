import { minerDependencies } from "../src/miner/runtime.js";

export default function handler(_req: unknown, res: { statusCode?: number; setHeader(name: string, value: string): void; end(body?: string): void }): void {
  res.statusCode = 200;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify({
    latency: minerDependencies.latency.snapshot(),
    cache: minerDependencies.cache.snapshot(),
    note: "Per-instance bounded telemetry; production aggregation belongs in the H1 operational layer.",
  }));
}
