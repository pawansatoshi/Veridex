import test from "node:test";
import assert from "node:assert/strict";
import { findIntent, summarizeLiveEvidence, TARGET_INTENT } from "../scripts/verify-smart-contract-audit-live.mjs";

test("finds the canonical Intent in an array response", () => {
  const found = findIntent([{ id: "OTHER" }, { intent_id: TARGET_INTENT, class: "hybrid" }]);
  assert.equal(found.class, "hybrid");
});

test("finds the canonical Intent in a keyed registry response", () => {
  const found = findIntent({ intents: { [TARGET_INTENT]: { class: "hybrid", canonical: true } } });
  assert.equal(found.canonical, true);
});

test("live evidence never promotes catalogue classification into live confirmation", () => {
  const result = summarizeLiveEvidence({
    checkedAt: "2026-11-16T00:00:00.000Z",
    baseUrl: "https://devnode.telegraphprotocol.com",
    registry: { ok: false, status: 503 },
    intentDetail: { ok: false, status: 503 },
    familyMiners: { ok: false, status: 503 },
    intentMiners: { ok: false, status: 503 },
    familyScorer: { ok: false, status: 503 },
    intentScorer: { ok: false, status: 503 },
    familyPool: { ok: false, status: 503 },
    intentPool: { ok: false, status: 503 }
  });
  assert.equal(result.decision.liveIntentConfirmed, false);
  assert.equal(result.decision.liveClassConfirmed, false);
  assert.equal(result.decision.questionMaterialRouteObserved, false);
  assert.equal(result.miners.intentCount, null);
  assert.equal(result.safety.includes("No wallet signing"), true);
});


test("blocks adapter registration on generic Judgment fallback even when catalogue is canonical", () => {
  const ok = (body) => ({ ok: true, status: 200, body });
  const result = summarizeLiveEvidence({
    checkedAt: "2026-11-23T00:00:00.000Z",
    baseUrl: "https://devnode.telegraphprotocol.com",
    registry: ok([{ intent_id: TARGET_INTENT, canonical: true }]),
    intentDetail: ok({ class: "judgment", request: null, response: null }),
    familyMiners: ok([]),
    intentMiners: ok([]),
    familyScorer: ok({ resolve: { class: "judgment", generic_fallback: true, served_by: "GENERIC" } }),
    intentScorer: ok({ resolve: { class: "judgment", generic_fallback: true, served_by: "GENERIC" } }),
    familyPool: ok({}),
    intentPool: ok({ min_submitters: 3, eligible_submitters: 3 })
  });
  assert.equal(result.decision.adapterRegistrationReady, false);
  assert.equal(result.decision.questionMaterialRouteObserved, true);
  assert.equal(result.decision.questionPoolReady, true);
  assert.ok(result.decision.adapterRegistrationBlockers.includes("generic_scorer_fallback"));
  assert.ok(result.decision.adapterRegistrationBlockers.includes("live_class_not_hybrid"));
  assert.ok(result.decision.adapterRegistrationBlockers.includes("request_schema_missing"));
});
