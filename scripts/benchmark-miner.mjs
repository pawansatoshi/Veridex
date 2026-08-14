#!/usr/bin/env node

const baseUrl = (process.env.VERIDEX_MINER_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");
const chain = process.env.VERIDEX_BENCHMARK_CHAIN ?? "ethereum";
const contractAddress = process.env.VERIDEX_BENCHMARK_ADDRESS;
const requests = Number.parseInt(process.env.VERIDEX_BENCHMARK_REQUESTS ?? "30", 10);
const concurrency = Number.parseInt(process.env.VERIDEX_BENCHMARK_CONCURRENCY ?? "3", 10);

if (!contractAddress || !/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) {
  console.error("Set VERIDEX_BENCHMARK_ADDRESS to a valid EVM contract address.");
  process.exit(2);
}
if (!Number.isInteger(requests) || requests < 5 || requests > 10000) throw new Error("requests must be in [5,10000]");
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) throw new Error("concurrency must be in [1,32]");

const durations = [];
let success = 0;
let unavailable = 0;
let errors = 0;
let timeouts = 0;
let cursor = 0;

async function one() {
  const started = performance.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20_000);
    try {
      const response = await fetch(`${baseUrl}/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ chain, contractAddress }),
        signal: controller.signal,
      });
      durations.push(performance.now() - started);
      if (response.ok) success += 1;
      else if (response.status === 503) unavailable += 1;
      else errors += 1;
    } finally {
      clearTimeout(timer);
    }
  } catch (error) {
    durations.push(performance.now() - started);
    if (error?.name === "AbortError") timeouts += 1;
    else errors += 1;
  }
}

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= requests) return;
    await one();
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
durations.sort((a, b) => a - b);

function percentile(q) {
  if (!durations.length) return 0;
  return durations[Math.min(durations.length - 1, Math.max(0, Math.ceil(q * durations.length) - 1))];
}

const result = {
  endpoint: baseUrl,
  chain,
  contractAddress,
  requests,
  concurrency,
  success,
  unavailable,
  errors,
  timeouts,
  p50_ms: Number(percentile(0.50).toFixed(2)),
  p95_ms: Number(percentile(0.95).toFixed(2)),
  p99_ms: Number(percentile(0.99).toFixed(2)),
  measured_at: new Date().toISOString(),
};

console.log(JSON.stringify(result, null, 2));
