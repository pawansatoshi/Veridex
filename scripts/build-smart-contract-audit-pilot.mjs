#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const EXPECTED = { reentrancy: 10, access_control: 10, arithmetic: 10 };

export function buildPilot(sourceRows, selections, sourceManifest = {}, generatedAt = new Date().toISOString()) {
  const byId = new Map();
  for (const row of sourceRows) {
    if (!row || typeof row.case_id !== "string" || !row.case_id) throw new Error("source row is missing case_id");
    if (byId.has(row.case_id)) throw new Error("duplicate source case_id: " + row.case_id);
    byId.set(row.case_id, row);
  }
  const ids = selections.map((row) => row.case_id);
  if (ids.length !== 30) throw new Error("pilot selection must contain exactly 30 case IDs");
  if (new Set(ids).size !== ids.length) throw new Error("pilot selection contains duplicate case IDs");
  const missing = ids.filter((id) => !byId.has(id));
  if (missing.length) throw new Error("pilot selection contains IDs missing from source queue: " + missing.join(", "));
  const cases = selections.map((selection) => {
    const source = byId.get(selection.case_id);
    if (selection.category && selection.category !== source.category) {
      throw new Error("category mismatch for " + selection.case_id + ": CSV=" + selection.category + ", source=" + source.category);
    }
    return {
      ...source,
      review_status: "needs_independent_human_review",
      reviewer: "",
      reviewed_at: "",
      prompt: "",
      chosen: "",
      rejected: "",
      provenance_source_kind: ""
    };
  });
  const byCategory = Object.fromEntries(Object.keys(EXPECTED).map((category) => [
    category,
    cases.filter((row) => row.category === category).length
  ]));
  for (const [category, expected] of Object.entries(EXPECTED)) {
    if (byCategory[category] !== expected) {
      throw new Error("expected " + expected + " " + category + " cases, found " + byCategory[category]);
    }
  }
  const distinctRepositories = new Set(cases.map((row) => row.source_repo).filter(Boolean)).size;
  const coverage = {};
  for (const field of ["source_url", "source_commit", "source_file", "source_references", "contract_name", "function_name"]) {
    coverage[field] = cases.filter((row) => {
      const value = row[field];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    }).length;
  }
  const manifest = {
    generated_at: generatedAt,
    intent_id: "SMART_CONTRACT_AUDIT_GENERAL",
    source: sourceManifest.source ?? "https://api.scvd.dev/findings",
    source_generated_at: sourceManifest.generated_at ?? null,
    source_total: sourceManifest.counts?.total ?? sourceRows.length,
    source_counts_by_category: sourceManifest.counts?.by_category ?? null,
    selection_file: "telegraph/evaluation/smart-contract-audit/pilot-review-30.csv",
    selection_method: "Curated stratified shortlist encoded in the committed CSV: 10 candidates per SCVD category. This is not a random or statistically representative sample.",
    counts: { total: cases.length, by_category: byCategory, distinct_source_repositories: distinctRepositories },
    metadata_coverage: coverage,
    policy: "Metadata-only human-review queue. Candidate taxonomy, severity, repository URLs, commits, and references are not proof of vulnerability validity. No prompt/answer preference labels are generated."
  };
  return { cases, manifest };
}

function readJsonl(file) {
  return fs.readFileSync(file, "utf8").split(/\r?\n/u).filter((line) => line.trim()).map((line, index) => {
    try { return JSON.parse(line); }
    catch { throw new Error("invalid JSON in " + file + " at line " + (index + 1)); }
  });
}
function readSelectionCsv(file) {
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/u).filter((line) => line.trim());
  if (!lines.length) throw new Error("pilot selection CSV is empty");
  return lines.slice(1).map((line, index) => {
    const fields = line.split(",");
    const caseId = (fields[0] ?? "").trim();
    const category = (fields[1] ?? "").trim();
    if (!caseId || !category) throw new Error("invalid pilot selection CSV row " + (index + 2));
    return { case_id: caseId, category };
  });
}
function main() {
  const root = "telegraph/evaluation/smart-contract-audit";
  const sourceDir = path.join(root, "source-candidates");
  const sourceRows = readJsonl(path.join(sourceDir, "review-queue.jsonl"));
  const sourceManifest = JSON.parse(fs.readFileSync(path.join(sourceDir, "manifest.json"), "utf8"));
  const selections = readSelectionCsv(path.join(root, "pilot-review-30.csv"));
  const { cases, manifest } = buildPilot(sourceRows, selections, sourceManifest);
  fs.writeFileSync(path.join(sourceDir, "pilot-review-30.jsonl"), cases.map((row) => JSON.stringify(row)).join("\n") + "\n", "utf8");
  fs.writeFileSync(path.join(sourceDir, "pilot-review-30-manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(manifest, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(); }
  catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); }
}