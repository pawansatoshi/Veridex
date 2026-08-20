#!/usr/bin/env node

const endpoint = process.env.TELEGRAPH_INTEGRATIONS_URL ?? "https://devnode.telegraphprotocol.com/miner-dispatcher/integrations";
const intentsEndpoint = process.env.TELEGRAPH_INTENTS_URL ?? "https://devnode.telegraphprotocol.com/engine/v1/intents";
const timeoutMs = Number.parseInt(process.env.TELEGRAPH_INTEGRATIONS_TIMEOUT_MS ?? "10000", 10);
const retries = Number.parseInt(process.env.TELEGRAPH_INTEGRATIONS_RETRIES ?? "3", 10);
const syncWaitMs = Number.parseInt(process.env.TELEGRAPH_INTEGRATION_SYNC_WAIT_MS ?? "30000", 10);
const syncAttempts = Number.parseInt(process.env.TELEGRAPH_INTEGRATION_SYNC_ATTEMPTS ?? "6", 10);

if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) throw new Error("timeout must be in [1000,60000]");
if (!Number.isInteger(retries) || retries < 0 || retries > 5) throw new Error("retries must be in [0,5]");
if (!Number.isInteger(syncWaitMs) || syncWaitMs < 1000 || syncWaitMs > 120000) throw new Error("syncWaitMs must be in [1000,120000]");
if (!Number.isInteger(syncAttempts) || syncAttempts < 1 || syncAttempts > 12) throw new Error("syncAttempts must be in [1,12]");

async function fetchJson(url) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { headers: { accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new Error(`${url} returned HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`${url} request failed`);
}

function normalizeEntries(body) {
  const entries = Array.isArray(body) ? body : Array.isArray(body.integrations) ? body.integrations : null;
  if (!entries) throw new Error("Unexpected Telegraph integration registry response shape");
  return entries;
}

function normalizeCanonicalIntents(body) {
  const intents = Array.isArray(body) ? body : Array.isArray(body.intents) ? body.intents : null;
  if (!intents) throw new Error("Unexpected Telegraph Intent-list response shape");
  return new Set(
    intents
      .filter((intent) => intent && intent.canonical !== false)
      .map((intent) => typeof intent === "string" ? intent : intent.intent_id ?? intent.intent_name ?? intent.name)
      .filter(Boolean),
  );
}

const canonicalIntents = normalizeCanonicalIntents(await fetchJson(intentsEndpoint));
let miner;
let lastReason = "not found";

for (let attempt = 1; attempt <= syncAttempts; attempt += 1) {
  const entries = normalizeEntries(await fetchJson(endpoint));
  miner = entries.find((entry) => String(entry.id ?? entry.miner_id ?? entry.minerId) === "1001" || entry.slug === "veridex-contract-risk-miner");
  if (!miner) {
    lastReason = "registered Miner #1001 was not present";
  } else {
    const advertisedIntents = Array.isArray(miner.supported_intents) ? miner.supported_intents : [];
    const invalidIntents = advertisedIntents.filter((intent) => !canonicalIntents.has(intent));
    const currentUrl = String(miner.base_url ?? "");
    const currentEndpoint = (miner.endpoints ?? []).some((entry) => entry.path === "/analyze" && entry.method === "POST");
    if (!/veridex-contract-risk-miner/.test(JSON.stringify(miner))) lastReason = "live registry Miner slug mismatch";
    else if (currentUrl !== "https://veridex-ecru.vercel.app") lastReason = "live registry Miner base URL mismatch";
    else if (!currentEndpoint) lastReason = "live registry Miner /analyze POST endpoint mismatch";
    else if (advertisedIntents.length === 0) lastReason = "live registry Miner has no supported Intents";
    else if (invalidIntents.length > 0) lastReason = `live registry advertises non-canonical Intents: ${invalidIntents.join(", ")}`;
    else {
      console.log(JSON.stringify({
        checkedAt: new Date().toISOString(),
        endpoint,
        intentsEndpoint,
        retryPolicy: { timeoutMs, retries, backoffMs: [250, 500, 1000, 2000, 4000].slice(0, retries) },
        syncPolicy: { syncWaitMs, syncAttempts },
        canonicalIntentCount: canonicalIntents.size,
        miner,
        valid: true,
      }, null, 2));
      process.exit(0);
    }
  }

  if (attempt < syncAttempts) await new Promise((resolve) => setTimeout(resolve, syncWaitMs));
}

throw new Error(`Live Telegraph Miner integration did not converge to a valid canonical configuration: ${lastReason}`);
