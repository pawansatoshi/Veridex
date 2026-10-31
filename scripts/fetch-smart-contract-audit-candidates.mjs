#!/usr/bin/env node
/**
 * Fetch SCVD public finding metadata for independent human annotation.
 * This script does not create preference labels or redistribute source code.
 */
import fs from "node:fs/promises";
import path from "node:path";

const BASE = "https://api.scvd.dev/findings";
const TAXONOMY = [
  { swc: "SWC-107", category: "reentrancy" },
  { swc: "SWC-105", category: "access_control" },
  { swc: "SWC-101", category: "arithmetic" }
];

function get(record, dotted) {
  return dotted.split(".").reduce((value, key) => value?.[key], record);
}
function pick(record, ...keys) {
  for (const key of keys) {
    const value = get(record, key);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}
function stableId(record, swc) {
  return String(pick(record, "scvd_id") ?? [swc, pick(record, "doc_id") ?? "", pick(record, "finding_index") ?? "", pick(record, "title") ?? ""].join(":"));
}
function sourceReferences(record) {
  return Array.isArray(record.references) ? record.references : [];
}
function sourceUrl(record) {
  const repo = pick(record, "repo.url");
  const commit = pick(record, "repo.commit");
  const file = pick(record, "repo.relative_file", "target.path");
  if (repo && commit && file) return repo.replace(/\/$/u, "") + "/blob/" + commit + "/" + String(file).replace(/^\//u, "");
  const refs = sourceReferences(record);
  const firstUrl = refs.find((value) => typeof value === "string" && /^https?:\/\//i.test(value) && !value.includes("api.scvd.dev"));
  return firstUrl ?? repo ?? null;
}
function sourceUrlKind(record) {
  const repo = pick(record, "repo.url");
  const commit = pick(record, "repo.commit");
  const file = pick(record, "repo.relative_file", "target.path");
  if (repo && commit && file) return "constructed_source_path";
  if (sourceReferences(record).some((value) => typeof value === "string" && /^https?:\/\//i.test(value))) return "external_reference";
  if (repo) return "repository_root";
  return "missing";
}
async function fetchCategory({ swc, category }) {
  let cursor = null;
  const seen = new Set();
  const all = [];
  for (;;) {
    const url = new URL(BASE);
    url.searchParams.set("swc", swc);
    url.searchParams.set("limit", "500");
    url.searchParams.set("sort", "normalized_at");
    url.searchParams.set("order", "desc");
    if (cursor) url.searchParams.set("cursor", cursor);
    const response = await fetch(url, { headers: { accept: "application/json" } });
    if (!response.ok) throw new Error(swc + ": SCVD API returned HTTP " + response.status);
    const body = await response.json();
    const batch = Array.isArray(body) ? body : (body.items ?? body.findings ?? body.data ?? []);
    if (!Array.isArray(batch)) throw new Error(swc + ": unexpected SCVD response shape");
    for (const item of batch) all.push({ ...item, _requested_swc: swc, _category: category });
    const next = response.headers.get("x-next-cursor") ?? body.next_cursor ?? null;
    if (!next || seen.has(next)) break;
    seen.add(next);
    cursor = next;
  }
  return all;
}
function toReviewCase(record) {
  const swcs = pick(record, "taxonomy.swc") ?? [];
  return {
    case_id: stableId(record, record._requested_swc),
    source_document_id: pick(record, "doc_id"),
    source_finding_index: pick(record, "finding_index"),
    category: record._category,
    swc: record._requested_swc,
    source_title: pick(record, "title"),
    source_summary: pick(record, "short_summary", "description_md"),
    source_severity: pick(record, "severity"),
    source_url: sourceUrl(record),
    source_url_kind: sourceUrlKind(record),
    source_references: sourceReferences(record),
    source_repo: pick(record, "repo.url"),
    source_commit: pick(record, "repo.commit"),
    source_file: pick(record, "repo.relative_file", "target.path"),
    contract_name: pick(record, "target.contract_name"),
    function_name: pick(record, "target.function"),
    chain: pick(record, "target.chain"),
    contract_address: pick(record, "target.contract_address"),
    taxonomy_swc: Array.isArray(swcs) ? swcs : [],
    review_status: "needs_independent_human_review",
    reviewer: "",
    reviewed_at: "",
    prompt: "",
    chosen: "",
    rejected: "",
    provenance_source_kind: "",
    reviewer_notes: "Do not infer exploitability or severity from taxonomy alone. Verify the cited report and code path."
  };
}
async function main() {
  const outDir = process.argv[2] ?? "telegraph/evaluation/smart-contract-audit/source-candidates";
  await fs.mkdir(outDir, { recursive: true });
  const records = [];
  for (const category of TAXONOMY) records.push(...await fetchCategory(category));
  const dedup = new Map();
  for (const row of records) {
    const key = stableId(row, row._requested_swc);
    if (!dedup.has(key)) dedup.set(key, row);
  }
  const cases = [...dedup.values()].map(toReviewCase);
  const jsonl = cases.map((row) => JSON.stringify(row)).join("\n") + (cases.length ? "\n" : "");
  await fs.writeFile(path.join(outDir, "review-queue.jsonl"), jsonl, "utf8");
  const byCategory = Object.fromEntries(TAXONOMY.map(({ swc, category }) => [category, cases.filter((row) => row.swc === swc).length]));
  const manifest = {
    generated_at: new Date().toISOString(),
    source: BASE,
    intent_id: "SMART_CONTRACT_AUDIT_GENERAL",
    counts: { total: cases.length, by_category: byCategory },
    policy: "Metadata-only review queue. No prompt/answer labels are generated. Every case requires independent human verification before it can become an attested preference pair."
  };
  await fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(manifest, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : String(error)); process.exit(1); });
