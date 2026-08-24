#!/usr/bin/env node

import { readFile } from "node:fs/promises";

const yamlPath = new URL("../telegraph/miner.yaml", import.meta.url);
const docsUrl = process.env.TELEGRAPH_YAML_STANDARD_URL ?? "https://raw.githubusercontent.com/telegraphprotocol/telegraph-docs/main/miners/yaml-config.md";
const intentsUrl = process.env.TELEGRAPH_INTENTS_URL ?? "https://devnode.telegraphprotocol.com/engine/v1/intents";
const expectedIntent = process.env.VERIDEX_TELEGRAPH_INTENT ?? "FRAUD_DETECTION";
const timeoutMs = Number.parseInt(process.env.TELEGRAPH_YAML_TIMEOUT_MS ?? "10000", 10);
const retries = Number.parseInt(process.env.TELEGRAPH_YAML_RETRIES ?? "3", 10);

if (!/^[A-Z][A-Z0-9_]{2,63}$/.test(expectedIntent)) throw new Error("VERIDEX_TELEGRAPH_INTENT must be a canonical uppercase Intent identifier");
if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60000) throw new Error("timeout must be in [1000,60000]");
if (!Number.isInteger(retries) || retries < 0 || retries > 5) throw new Error("retries must be in [0,5]");

const yaml = await readFile(yamlPath, "utf8");

if (/^\s+intents:\s*$/m.test(yaml)) {
  throw new Error("telegraph/miner.yaml uses endpoint-level intents; current Telegraph standard requires semantics.supported_intents");
}

const supportedMatch = yaml.match(/semantics:\s*\n(?:.|\n)*?supported_intents:\s*\n((?:\s+-\s+[^\n]+\n?)+)/m);
if (!supportedMatch) throw new Error("Missing semantics.supported_intents in telegraph/miner.yaml");

const configured = [...supportedMatch[1].matchAll(/^\s+-\s+([A-Z0-9_]+)\s*$/gm)].map((match) => match[1]);
if (configured.length === 0) throw new Error("semantics.supported_intents must contain at least one Intent");
if (configured.length !== 1 || configured[0] !== expectedIntent) {
  throw new Error(`Veridex Miner must declare exactly ${expectedIntent}; configured: ${configured.join(", ") || "none"}`);
}

async function fetchJsonWithRetry(url) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { headers: { accept: "application/json" }, signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch ${url}`);
}

const docsResponse = await fetch(docsUrl, { headers: { accept: "text/plain" } });
if (!docsResponse.ok) throw new Error(`Unable to fetch Telegraph YAML standard: HTTP ${docsResponse.status}`);
const docs = await docsResponse.text();
if (!docs.includes("semantics.supported_intents") || !docs.includes("Canonical Intents")) {
  throw new Error("Telegraph YAML standard did not expose the current semantics.supported_intents contract");
}

const intentBody = await fetchJsonWithRetry(intentsUrl);
const intents = Array.isArray(intentBody) ? intentBody : Array.isArray(intentBody.intents) ? intentBody.intents : null;
if (!intents) throw new Error("Unexpected Telegraph live Intent response shape");

const canonical = new Set(
  intents
    .filter((intent) => intent && intent.canonical !== false)
    .map((intent) => typeof intent === "string" ? intent : intent.intent_id ?? intent.intent_name ?? intent.name)
    .filter(Boolean),
);

if (!canonical.has(expectedIntent)) {
  throw new Error(`Required Veridex Intent is not canonical in the live Telegraph registry: ${expectedIntent}`);
}

const invalid = configured.filter((intent) => !canonical.has(intent));
if (invalid.length > 0) {
  throw new Error(`Unsupported Telegraph Intent(s) in live canonical registry: ${invalid.join(", ")}`);
}

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  standard: docsUrl,
  liveIntentRegistry: intentsUrl,
  expectedIntent,
  configuredIntents: configured,
  canonicalIntents: [...canonical].sort(),
  valid: true,
}, null, 2));
