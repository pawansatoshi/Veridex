#!/usr/bin/env node

const endpoint = process.env.TELEGRAPH_INTEGRATIONS_URL ?? "https://devnode.telegraphprotocol.com/miner-dispatcher/integrations";
const timeoutMs = Number.parseInt(process.env.TELEGRAPH_INTEGRATIONS_TIMEOUT_MS ?? "10000", 10);
const retries = Number.parseInt(process.env.TELEGRAPH_INTEGRATIONS_RETRIES ?? "3", 10);

if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) throw new Error("timeout must be in [1000,60000]");
if (!Number.isInteger(retries) || retries < 0 || retries > 5) throw new Error("retries must be in [0,5]");

async function fetchRegistry() {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(endpoint, { headers: { accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new Error(`Telegraph integration registry returned HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Telegraph integration registry request failed");
}

const body = await fetchRegistry();
const entries = Array.isArray(body) ? body : Array.isArray(body.integrations) ? body.integrations : null;
if (!entries) throw new Error("Unexpected Telegraph integration registry response shape");

const miner = entries.find((entry) => String(entry.id ?? entry.miner_id ?? entry.minerId) === "1001" || entry.slug === "veridex-contract-risk-miner");
if (!miner) throw new Error("Registered Veridex Miner #1001 was not present in the live Telegraph integration registry");

const raw = JSON.stringify(miner);
if (!/veridex-contract-risk-miner/.test(raw)) throw new Error("Live registry Miner slug mismatch");
if (!/https:\/\/veridex-ecru\.vercel\.app/.test(raw)) throw new Error("Live registry Miner base URL mismatch");
if (!/\/analyze/.test(raw)) throw new Error("Live registry Miner endpoint mismatch: /analyze not present");
if (/FRAUD_DETECTION/.test(raw)) throw new Error("Live registry still advertises deprecated/non-canonical FRAUD_DETECTION for Miner #1001; re-registration/sync is required");
if (!/CONTENT_VERIFICATION/.test(raw)) throw new Error("Live registry does not advertise current canonical CONTENT_VERIFICATION for Miner #1001");

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  endpoint,
  retryPolicy: { timeoutMs, retries, backoffMs: [250, 500, 1000, 2000, 4000].slice(0, retries) },
  miner,
  valid: true,
}, null, 2));
