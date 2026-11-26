#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export const TARGET_FAMILY = "SMART_CONTRACT_AUDIT";
export const TARGET_INTENT = "SMART_CONTRACT_AUDIT_GENERAL";
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

function minerEntries(result) {
  const body = result.ok ? result.body : null;
  const entries = Array.isArray(body) ? body : (body?.miners ?? body?.items);
  return Array.isArray(entries) ? entries : null;
}
function resolveBody(result) {
  const body = result.ok ? result.body : null;
  return body?.resolve ?? body ?? null;
}
function poolSummary(result) {
  const body = result.ok ? result.body : null;
  return {
    endpointOk: result.ok,
    httpStatus: result.status,
    byState: body?.by_state ?? body?.counts ?? null,
    submitters: body?.submitters ?? null,
    eligibleSubmitters: body?.eligible_submitters ?? null,
    minSubmitters: body?.min_submitters ?? null,
    snapshot: body?.snapshot ?? null,
    activeSnapshot: body?.active_snapshot ?? null,
    raw: body
  };
}

export function summarizeLiveEvidence({ checkedAt, baseUrl, registry, intentDetail, familyMiners, intentMiners, familyScorer, intentScorer, familyPool, intentPool }) {
  const intent = registry.ok ? findIntent(registry.body, TARGET_INTENT) : null;
  const detail = intentDetail.ok ? intentDetail.body : null;
  const familyMinerList = minerEntries(familyMiners);
  const intentMinerList = minerEntries(intentMiners);
  const familyResolve = resolveBody(familyScorer);
  const intentResolve = resolveBody(intentScorer);
  const pool = poolSummary(intentPool);
  const classValue = intentResolve?.class ?? familyResolve?.class ?? null;
  const genericFallback = Boolean(intentResolve?.generic_fallback ?? familyResolve?.generic_fallback);
  const request = detail?.request ?? detail?.request_schema ?? detail?.requestSchema ?? intent?.request ?? null;
  const response = detail?.response ?? detail?.response_schema ?? detail?.responseSchema ?? intent?.response ?? null;
  const compactMiners = (intentMinerList ?? []).map((miner) => ({
    id: miner.id ?? null,
    slug: miner.slug ?? null,
    name: miner.name ?? null,
    activation_status: miner.activation_status ?? null,
    supported_intents: miner.supported_intents ?? miner.capabilities ?? null
  }));
  const compactScorer = (result, target) => {
    const body = result.ok ? result.body : null;
    return {
      count: body?.count ?? null,
      resolve: body?.resolve ?? null,
      targetEntries: body?.intents?.[target] ?? null
    };
  };
  return {
    schema: "veridex.smart-contract-audit.live-evidence.v2",
    checkedAt,
    node: baseUrl,
    intentFamily: TARGET_FAMILY,
    intentId: TARGET_INTENT,
    catalogue: {
      found: Boolean(intent),
      canonical: intent?.canonical ?? null,
      minerCount: intent?.miner_count ?? intent?.minerCount ?? (Array.isArray(intentMinerList) ? intentMinerList.length : null),
      description: intent?.description ?? null,
      detailHttpStatus: intentDetail.status,
      request,
      response,
      raw: intent,
      detail: detail ? {
        class: detail.class ?? null,
        adapterRegistration: detail.adapter_registration ?? null,
        activeAdapterRegistrationId: detail.evaluation?.adapter?.registration_id ?? null,
        request: detail.request ?? null,
        response: detail.response ?? null,
        miner_count: detail.miner_count ?? null,
        wasm_count: detail.wasm_count ?? null
      } : null
    },
    miners: {
      familyEndpointOk: familyMiners.ok,
      familyHttpStatus: familyMiners.status,
      familyCount: Array.isArray(familyMinerList) ? familyMinerList.length : null,
      intentEndpointOk: intentMiners.ok,
      intentHttpStatus: intentMiners.status,
      intentCount: Array.isArray(intentMinerList) ? intentMinerList.length : null,
      entries: compactMiners
    },
    scorer: {
      familyEndpointOk: familyScorer.ok,
      familyHttpStatus: familyScorer.status,
      familyResolution: familyResolve,
      intentEndpointOk: intentScorer.ok,
      intentHttpStatus: intentScorer.status,
      intentResolution: intentResolve,
      raw: {
        family: compactScorer(familyScorer, TARGET_FAMILY),
        intent: compactScorer(intentScorer, TARGET_INTENT)
      }
    },
    evaluationPool: pool,
    familyEvaluationPool: poolSummary(familyPool),
    endpoints: {
      registry: { ok: registry.ok, status: registry.status, target: intent },
      intentDetail: { ok: intentDetail.ok, status: intentDetail.status, detail: detail ? { class: detail.class ?? null, request, response } : null },
      familyMiners: { ok: familyMiners.ok, status: familyMiners.status, count: familyMinerList?.length ?? null },
      intentMiners: { ok: intentMiners.ok, status: intentMiners.status, count: intentMinerList?.length ?? null },
      familyScorer: { ok: familyScorer.ok, status: familyScorer.status, resolve: familyResolve },
      intentScorer: { ok: intentScorer.ok, status: intentScorer.status, resolve: intentResolve },
      familyPool: poolSummary(familyPool),
      intentPool: pool
    },
    decision: {
      liveIntentConfirmed: Boolean(intent),
      liveCanonicalConfirmed: intent?.canonical === true,
      liveClassConfirmed: Boolean(classValue && !genericFallback),
      resolvedClass: classValue,
      genericFallback,
      liveRequestSchemaConfirmed: Boolean(request),
      liveResponseSchemaConfirmed: Boolean(response),
      scorerResolved: Boolean(intentResolve?.scorer ?? familyResolve?.scorer),
      activeMinerCountKnown: Array.isArray(intentMinerList),
      activeMinerCount: Array.isArray(intentMinerList) ? intentMinerList.length : null,
      questionMaterialRouteObserved: intent?.canonical === true && pool.endpointOk &&
        ["judgment", "hybrid"].includes(classValue),
      questionPoolReady: pool.endpointOk && Number.isInteger(pool.minSubmitters) &&
        pool.minSubmitters > 0 && Number.isInteger(pool.eligibleSubmitters) &&
        pool.eligibleSubmitters >= pool.minSubmitters,
      eligibleRowsPresent: Number(pool.byState?.eligible ?? 0) > 0,
      adapterRegistrationReady: Boolean(intent?.canonical === true && classValue === "hybrid" && !genericFallback && request && response && intentResolve?.scorer),
      adapterRegistrationBlockers: [
        ...(!intent || intent.canonical !== true ? ["canonical_intent_unconfirmed"] : []),
        ...(classValue !== "hybrid" ? ["live_class_not_hybrid"] : []),
        ...(genericFallback ? ["generic_scorer_fallback"] : []),
        ...(!request ? ["request_schema_missing"] : []),
        ...(!response ? ["response_schema_missing"] : []),
        ...(!intentResolve?.scorer ? ["dedicated_scorer_unconfirmed"] : [])
      ]
    },
    interpretation: "The Season II catalogue labels SMART_CONTRACT_AUDIT Hybrid. The live node's SMART_CONTRACT_AUDIT_GENERAL registry and scorer resolution are recorded independently; generic_fallback means the live family scorer is not a confirmed dedicated module.",
    safety: "Read-only diagnostics only. No wallet signing, upload, bond, registration, or payment was attempted."
  };
}

async function main() {
  const checkedAt = new Date().toISOString();
  const [registry, intentDetail, familyMiners, intentMiners, familyScorer, intentScorer, familyPool, intentPool] = await Promise.all([
    getJson("/engine/v1/intents"),
    getJson("/engine/v1/intents/" + TARGET_INTENT),
    getJson("/engine/v1/intents/" + TARGET_FAMILY + "/miners"),
    getJson("/engine/v1/intents/" + TARGET_INTENT + "/miners"),
    getJson("/api/wasm?resolve=" + TARGET_FAMILY),
    getJson("/api/wasm?resolve=" + TARGET_INTENT),
    getJson("/api/evalpool/status?intent_id=" + TARGET_FAMILY),
    getJson("/api/evalpool/status?intent_id=" + TARGET_INTENT)
  ]);
  const result = summarizeLiveEvidence({ checkedAt, baseUrl: BASE, registry, intentDetail, familyMiners, intentMiners, familyScorer, intentScorer, familyPool, intentPool });
  const output = process.env.VERIDEX_AUDIT_LIVE_OUTPUT ?? "artifacts/smart-contract-audit-live-evidence.json";
  fs.mkdirSync(output.slice(0, Math.max(0, output.lastIndexOf("/"))) || ".", { recursive: true });
  fs.writeFileSync(output, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(result, null, 2));
  if (!result.decision.liveIntentConfirmed || !result.decision.adapterRegistrationReady) process.exitCode = 1;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
