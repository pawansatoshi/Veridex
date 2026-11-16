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
  assert.equal(result.safety.includes("No wallet signing"), true);
});
