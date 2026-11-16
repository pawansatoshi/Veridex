#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export const TARGET_INTENT = "SMART_CONTRACT_AUDIT";
const BASE = (process.env.TELEGRAPH_NODE_URL ?? "https://devnode.telegraphprotocol.com").replace(/\/$/u, "");

async function getJson(path, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(BASE + path, { headers: { accept: "application/json" }, signal: controller.signal });
    const text = await response.text();
    let body;
    try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text.slice(0, 4000) }; }
    return { ok: response.ok, status: response.status, body };
  } catch (error) {
    return { ok: false, status: null, error: error instanceof Error ? error.message : String(error) };
  } finally {
    clearTimeout(timer);
  }
}

export function findIntent(payload, target = TARGET_INTENT) {
  const seen = new Set();
  const visit = (value) => {
    if (!value || typeof value !== "object" || seen.has(value)) return null;
    seen.add(value);
    if (Array.isArray(value)) {
      for (const item of value) { const found = visit(item); if (found) return found; }
      return null;
    }
    const id = value.intent_id ?? value.intentId ?? value.id ?? value.name;
    if (typeof id === "string" && id.toUpperCase() === target) return value;
    if (Object.prototype.hasOwnProperty.call(value, target)) {
      const item = value[target];
      return item && typeof item === "object" ? { intent_id: target, ...item } : { intent_id: target, value: item };
    }
    for (const child of Object.values(value)) { const found = visit(child); if (found) return found; }
    return null;
  };
  return visit(payload);
}

export function summarizeLiveEvidence({ checkedAt, baseUrl, registry, miners, scorer, pool }) {
  const intent = registry.ok ? findIntent(registry.body) : null;
  const minerBody = miners.ok ? miners.body : null;
  const minerList = Array.isArray(minerBody) ? minerBody : (minerBody?.miners ?? minerBody?.items ?? []);
  const scorerBody = scorer.ok ? scorer.body : null;
  const poolBody = pool.ok ? pool.body : null;
  const classValue = intent?.class ?? intent?.kind ?? intent?.scoring_class ?? intent?.scoringClass ?? null;
  const request = intent?.request ?? intent?.request_schema ?? intent?.requestSchema ?? null;
  const response = intent?.response ?? intent?.response_schema ?? intent?.responseSchema ?? null;
  return {
    schema: "veridex.smart-contract-audit.live-evidence.v1",
    checkedAt,
    node: baseUrl,
    intentId: TARGET_INTENT,
    catalogue: {
      found: Boolean(intent),
      class: classValue,
      canonical: intent?.canonical ?? null,
      minerCount: intent?.miner_count ?? intent?.minerCount ?? (Array.isArray(minerList) ? minerList.length : null),
      request,
      response,
      raw: intent
    },
    miners: {
      endpointOk: miners.ok,
      httpStatus: miners.status,
      count: Array.isArray(minerList) ? minerList.length : null,
      entries: Array.isArray(minerList) ? minerList : null,
      raw: minerBody
    },
    scorer: {
      endpointOk: scorer.ok,
      httpStatus: scorer.status,
      resolution: scorerBody?.resolve ?? scorerBody,
      raw: scorerBody
    },
    evaluationPool: {
      endpointOk: pool.ok,
      httpStatus: pool.status,
      byState: poolBody?.by_state ?? poolBody?.counts ?? null,
      submitters: poolBody?.submitters ?? null,
      eligibleSubmitters: poolBody?.eligible_submitters ?? null,
      minSubmitters: poolBody?.min_submitters ?? null,
      snapshot: poolBody?.snapshot ?? null,
      activeSnapshot: poolBody?.active_snapshot ?? null,
      raw: poolBody
    },
    endpoints: { registry, miners, scorer, pool },
    decision: {
      liveIntentConfirmed: Boolean(intent),
      liveClassConfirmed: Boolean(classValue),
      liveRequestSchemaConfirmed: Boolean(request),
      liveResponseSchemaConfirmed: Boolean(response),
      scorerResolved: Boolean(scorerBody?.resolve?.scorer ?? scorerBody?.scorer),
      activeMinerCountKnown: Array.isArray(minerList),
      questionPoolReady: Number(poolBody?.eligible_submitters ?? 0) >= 5,
      eligibleRowsPresent: Number(poolBody?.by_state?.eligible ?? poolBody?.eligible ?? 0) > 0
    },
    safety: "Read-only diagnostics only. No wallet signing, upload, bond, registration, or payment was attempted."
  };
}

async function main() {
  const checkedAt = new Date().toISOString();
  const [registry, miners, scorer, pool] = await Promise.all([
    getJson("/engine/v1/intents"),
    getJson("/engine/v1/intents/" + TARGET_INTENT + "/miners"),
    getJson("/api/wasm?resolve=" + TARGET_INTENT),
    getJson("/api/evalpool/status?intent_id=" + TARGET_INTENT)
  ]);
  const result = summarizeLiveEvidence({ checkedAt, baseUrl: BASE, registry, miners, scorer, pool });
  const output = process.env.VERIDEX_AUDIT_LIVE_OUTPUT ?? "artifacts/smart-contract-audit-live-evidence.json";
  fs.mkdirSync(output.slice(0, Math.max(0, output.lastIndexOf("/"))) || ".", { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(result, null, 2));
  if (!result.decision.liveIntentConfirmed) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
