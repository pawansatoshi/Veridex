import test from "node:test";
import assert from "node:assert/strict";
import { buildPilot } from "../scripts/build-smart-contract-audit-pilot.mjs";

function fixture() {
  const categories = ["reentrancy", "access_control", "arithmetic"];
  const rows = categories.flatMap((category) => Array.from({ length: 10 }, (_, index) => ({
    case_id: category + "-" + index,
    category,
    source_repo: "https://example.test/" + category + "/" + index,
    source_url: "https://example.test/source/" + category + "/" + index,
    source_commit: "abc" + index,
    source_file: index % 2 ? "Contract.sol" : null,
    source_references: [],
    review_status: "needs_independent_human_review",
    prompt: "",
    chosen: "",
    rejected: "",
    provenance_source_kind: ""
  })));
  return { rows, selections: rows.map((row) => ({ case_id: row.case_id, category: row.category })) };
}

test("builds a 30-case stratified queue without generating labels", () => {
  const { rows, selections } = fixture();
  const result = buildPilot(rows, selections, { counts: { total: 100, by_category: {} } }, "2026-10-31T00:00:00.000Z");
  assert.equal(result.cases.length, 30);
  assert.deepEqual(result.manifest.counts.by_category, { reentrancy: 10, access_control: 10, arithmetic: 10 });
  assert.equal(result.manifest.counts.distinct_source_repositories, 30);
  assert.ok(result.cases.every((row) => row.chosen === "" && row.rejected === "" && row.provenance_source_kind === ""));
});

test("rejects missing and duplicate selection IDs", () => {
  const { rows, selections } = fixture();
  assert.throws(() => buildPilot(rows, selections.slice(1), {}), /exactly 30/);
  assert.throws(() => buildPilot(rows, [selections[0], ...selections.slice(1, 29), selections[0]], {}), /duplicate case IDs/);
  assert.throws(() => buildPilot(rows, [{ ...selections[0], case_id: "missing" }, ...selections.slice(1)], {}), /missing from source queue/);
});

test("rejects category mismatches between CSV and source metadata", () => {
  const { rows, selections } = fixture();
  const wrong = selections.map((row, index) => index === 0 ? { ...row, category: "arithmetic" } : row);
  assert.throws(() => buildPilot(rows, wrong, {}), /category mismatch/);
});