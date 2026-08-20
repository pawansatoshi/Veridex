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
const controlRetries = Number.parseInt(process.env.VERIDEX_BENCHMARK_CONTROL_RETRIES ?? "2", 10);
const requestRetries = Number.parseInt(process.env.VERIDEX_BENCHMARK_REQUEST_RETRIES ?? "2", 10);

for (const address of addresses) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error(`Invalid benchmark address: ${address}`);
}
if (!Number.isInteger(requestsPerAddress) || requestsPerAddress < 3 || requestsPerAddress > 1000) throw new Error("requests must be in [3,1000]");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) throw new Error("concurrency must be in [1,32]");
if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60_000) throw new Error("timeout must be in [1000,60000]");
if (!Number.isInteger(controlRetries) || controlRetries < 0 || controlRetries > 5) throw new Error("controlRetries must be in [0,5]");
if (!Number.isInteger(requestRetries) || requestRetries < 0 || requestRetries > 5) throw new Error("requestRetries must be in [0,5]");

async function getJson(path) {
  let lastError;
  for (let attempt = 0; attempt <= controlRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: "application/json" }, signal: controller.signal });
      const body = await response.json();
      if (!response.ok) throw new Error(`${path} returned ${response.status}: ${JSON.stringify(body)}`);
      return body;
    } catch (error) {
      lastError = error;
      if (attempt >= controlRetries) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${path} failed`);
}

async function analyze(address) {
  const started = performance.now();
  let lastResult;

  for (let attempt = 0; attempt <= requestRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${baseUrl}/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ chain, contractAddress: address }),
        signal: controller.signal,
      });
      let body = null;
      try { body = await response.json(); } catch { body = null; }
      const transient = response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504;
      lastResult = { durationMs: performance.now() - started, status: response.status, body };
      if (!transient || attempt >= requestRetries) return lastResult;
    } catch (error) {
      lastResult = { durationMs: performance.now() - started, status: 0, error: error?.name === "AbortError" ? "timeout" : String(error) };
      if (attempt >= requestRetries) return lastResult;
    } finally {
      clearTimeout(timer);
    }
    await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
  }

  return lastResult;
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
  const percentile = (values, q) => values.length === 0 ? null : values[Math.min(values.length - 1, Math.max(0, Math.ceil(q * values.length) - 1))];
  const cold = observations.find((item) => item.index === 0);

  return {
    contractAddress: address,
    requests: requestsPerAddress,
    concurrency,
    requestRetries,
    success,
    unavailable,
    errors,
    timeouts,
    cold_ms: cold ? Number(cold.durationMs.toFixed(2)) : null,
    warm_requests: warmDurations.length,
    warm_p50_ms: percentile(warmDurations, 0.50) === null ? null : Number(percentile(warmDurations, 0.50).toFixed(2)),
    warm_p95_ms: percentile(warmDurations, 0.95) === null ? null : Number(percentile(warmDurations, 0.95).toFixed(2)),
    warm_p99_ms: percentile(warmDurations, 0.99) === null ? null : Number(percentile(warmDurations, 0.99).toFixed(2)),
    p50_ms: percentile(durations, 0.50) === null ? null : Number(percentile(durations, 0.50).toFixed(2)),
    p95_ms: percentile(durations, 0.95) === null ? null : Number(percentile(durations, 0.95).toFixed(2)),
    p99_ms: percentile(durations, 0.99) === null ? null : Number(percentile(durations, 0.99).toFixed(2)),
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
  controlRetryPolicy: { timeoutMs, retries: controlRetries, backoffMs: [250, 500, 1000, 2000, 4000].slice(0, controlRetries) },
  corpus: addresses,
  results,
  metricsBefore: before,
  metricsAfter: after,
};

console.log(JSON.stringify(result, null, 2));

const failed = results.filter((item) => item.success !== item.requests || item.unavailable > 0 || item.errors > 0 || item.timeouts > 0 || item.warm_requests !== item.requests - 1);
if (failed.length > 0) {
  console.error(`Production benchmark failed for ${failed.length} address(es).`);
  process.exit(1);
}
