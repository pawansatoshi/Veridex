import { runResilienceSelfTest } from "../src/infrastructure/resilience.js";

export default function handler(_req: unknown, res: { statusCode?: number; setHeader(name: string, value: string): void; end(body?: string): void }): void {
  const result = runResilienceSelfTest();
  res.statusCode = result.valid ? 200 : 503;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(result));
}
