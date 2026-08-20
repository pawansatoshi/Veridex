#!/usr/bin/env node

const baseUrl = (process.env.VERIDEX_MINER_URL ?? "https://veridex-ecru.vercel.app").replace(/\/$/, "");
const chain = process.env.VERIDEX_BENCHMARK_CHAIN ?? "1";
const addresses = (process.env.VERIDEX_BENCHMARK_ADDRESSES ?? process.env.VERIDEX_BENCHMARK_ADDRESS ?? "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const requestsPerAddress = Number.parseInt(process.env.VERIDEX_BENCHMARK_REQUESTS ?? "10", 10);
const concurrency = Number.parseInt(process.env.VERIDEX_BENCHMARK_CONCURRENCY ?? "3", 10);
const timeoutMs = Number.parseInt(process.env.VERIDEX_BENCHMARK_TIMEOUT_MS ?? "20000", 10);

for (const address of addresses) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error(`Invalid benchmark address: ${address}`);
}
if (!Number.isInteger(requestsPerAddress) || requestsPerAddress < 3 || requestsPerAddress > 1000) throw new Error("requests must be in [3,1000]");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) throw new Error("concurrency must be in [1,32]");
if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60_000) throw new Error("timeout must be in [1000,60000]");

async function getJson(path) {
  const response = await fetch(`${baseUrl}${path}`, { headers: { accept: "application/json" } });
  const body = await response.json();
  if (!response.ok) throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
  return body;
}

async function analyze(address) {
  const started = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ chain, contractAddress: address }),
      signal: controller.signal,
    });
    const body = await response.json();
    return { durationMs: performance.now() - started, status: response.status, body };
  } catch (error) {
    return { durationMs: performance.now() - started, status: 0, error: error?.name === "AbortError" ? "timeout" : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

async function runAddress(address) {
  const observations = [];
  let success = 0;
  let unavailable = 0;
  let errors = 0;
  let timeouts = 0;
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= requestsPerAddress) return;
      const result = await analyze(address);
      observations.push({ index, ...result });
      if (result.status >= 200 && result.status < 300) success += 1;
      else if (result.status === 503) unavailable += 1;
      else if (result.error === "timeout") timeouts += 1;
      else errors += 1;
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, requestsPerAddress) }, worker));
  const durations = observations.map((item) => item.durationMs).sort((a, b) => a - b);
  const warmDurations = observations.filter((item) => item.index > 0).map((item) => item.durationMs).sort((a, b) => a - b);
  const percentile = (values, q) => values[Math.min(values.length - 1, Math.max(0, Math.ceil(q * values.length) - 1))] ?? 0;
  const cold = observations.find((item) => item.index === 0);

  return {
    contractAddress: address,
    requests: requestsPerAddress,
    concurrency,
    success,
    unavailable,
    errors,
    timeouts,
    cold_ms: cold ? Number(cold.durationMs.toFixed(2)) : null,
    warm_requests: warmDurations.length,
    warm_p50_ms: Number(percentile(warmDurations, 0.50).toFixed(2)),
    warm_p95_ms: Number(percentile(warmDurations, 0.95).toFixed(2)),
    warm_p99_ms: Number(percentile(warmDurations, 0.99).toFixed(2)),
    p50_ms: Number(percentile(durations, 0.50).toFixed(2)),
    p95_ms: Number(percentile(durations, 0.95).toFixed(2)),
    p99_ms: Number(percentile(durations, 0.99).toFixed(2)),
  };
}

const health = await getJson("/health");
const before = await getJson("/metrics");
const startedAt = new Date().toISOString();
const results = [];
for (const address of addresses) results.push(await runAddress(address));
const after = await getJson("/metrics");

const result = {
  schema: "veridex.production-benchmark.v2",
  endpoint: baseUrl,
  chain,
  startedAt,
  finishedAt: new Date().toISOString(),
  health,
  corpus: addresses,
  results,
  metricsBefore: before,
  metricsAfter: after,
};

console.log(JSON.stringify(result, null, 2));
