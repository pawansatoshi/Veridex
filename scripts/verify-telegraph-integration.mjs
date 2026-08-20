#!/usr/bin/env node

const endpoint = process.env.TELEGRAPH_INTEGRATIONS_URL ?? "https://devnode.telegraphprotocol.com/miner-dispatcher/integrations";
const response = await fetch(endpoint, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(10_000) });
if (!response.ok) throw new Error(`Telegraph integration registry returned HTTP ${response.status}`);

const body = await response.json();
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
  miner,
  valid: true,
}, null, 2));
