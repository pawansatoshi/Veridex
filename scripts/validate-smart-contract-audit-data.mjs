#!/usr/bin/env node
/**
 * Validate Telegraph SMART_CONTRACT_AUDIT preference-pair data before upload.
 * This is a local quality gate, not a substitute for human review or node curation.
 */
import fs from "node:fs";

const args = process.argv.slice(2);
const inputFlag = args.indexOf("--input");
if (inputFlag < 0 || !args[inputFlag + 1]) {
  console.error("Usage: node scripts/validate-smart-contract-audit-data.mjs --input <pairs.jsonl>");
  process.exit(2);
}
const file = args[inputFlag + 1];
const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((line) => line.trim().length > 0);
const errors = [];
const rows = [];

for (let i = 0; i < lines.length; i++) {
  let row;
  try { row = JSON.parse(lines[i]); }
  catch { errors.push(`line ${i + 1}: invalid JSON`); continue; }
  const line = i + 1;
  for (const key of ["prompt", "chosen", "rejected"]) {
    if (typeof row[key] !== "string" || !row[key].trim()) errors.push(`line ${line}: missing/non-string ${key}`);
  }
  if (typeof row.prompt !== "string" || typeof row.chosen !== "string" || typeof row.rejected !== "string") continue;
  if (row.label_kind && row.label_kind !== "preference_pair") errors.push(`line ${line}: label_kind must be preference_pair`);
  if (row.intent_id && row.intent_id !== "SMART_CONTRACT_AUDIT_GENERAL") errors.push(`line ${line}: wrong intent_id`);
  if (row.prompt.length < 16 || row.prompt.length > 16000) errors.push(`line ${line}: prompt length outside 16..16000`);
  for (const key of ["chosen", "rejected"]) {
    if (row[key].length < 8 || row[key].length > 32000) errors.push(`line ${line}: ${key} length outside 8..32000`);
  }
  if (row.chosen === row.rejected) errors.push(`line ${line}: chosen and rejected are identical`);
  const p = row.provenance;
  if (!p || typeof p !== "object" || typeof p.source_kind !== "string" || typeof p.source_url !== "string") {
    errors.push(`line ${line}: provenance.source_kind and provenance.source_url are required`);
  } else {
    if (["llm", "synthetic", "generated", "model"].includes(p.source_kind.toLowerCase())) {
      errors.push(`line ${line}: generated provenance is unverified and cannot be represented as attested human material`);
    }
    try {
      const u = new URL(p.source_url);
      if (u.protocol !== "https:") errors.push(`line ${line}: provenance URL must use https`);
    } catch { errors.push(`line ${line}: invalid provenance URL`); }
  }
  rows.push(row);
}

const norm = (s) => s.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
const prompts = new Map();
for (let i = 0; i < rows.length; i++) {
  const key = norm(rows[i].prompt);
  if (prompts.has(key)) errors.push(`duplicate normalized prompt at rows ${prompts.get(key)} and ${i + 1}`);
  else prompts.set(key, i + 1);
}

const rejectedCounts = new Map(rows.map((r) => [r.rejected, (rows.filter((x) => x.rejected === r.rejected).length)]));
const uniqueRejected = rejectedCounts.size;
const maxRejectedShare = rows.length ? Math.max(...rejectedCounts.values()) / rows.length : 1;
const sameAnswerRate = rows.length ? rows.filter((r) => r.chosen === r.rejected).length / rows.length : 1;

// Best one-dimensional threshold classifier using only chosen-vs-rejected word-count difference.
const diffs = rows.map((r) => r.chosen.trim().split(/\s+/).length - r.rejected.trim().split(/\s+/).length);
let lengthOnlyAccuracy = 1;
if (diffs.length) {
  const candidates = [...new Set([-Infinity, Infinity, ...diffs, ...diffs.map((v) => v + 0.000001)])];
  let best = 0;
  for (const t of candidates) {
    const correct = diffs.filter((v) => v > t).length;
    best = Math.max(best, correct / diffs.length, (diffs.length - correct) / diffs.length);
  }
  lengthOnlyAccuracy = best;
}

if (rows.length < 50) errors.push(`only ${rows.length} pairs; need at least 50 for meaningful uniqueness checks (target substantially more for training)`);
if (rows.length && uniqueRejected / rows.length < 0.8) errors.push(`unique rejected answers ${(uniqueRejected / rows.length * 100).toFixed(1)}% < 80%`);
if (maxRejectedShare > 0.02) errors.push(`most-repeated rejected answer share ${(maxRejectedShare * 100).toFixed(1)}% > 2%`);
if (sameAnswerRate > 0.01) errors.push(`identical answer rate ${(sameAnswerRate * 100).toFixed(1)}% > 1%`);
if (lengthOnlyAccuracy > 0.65) errors.push(`word-count-only best accuracy ${(lengthOnlyAccuracy * 100).toFixed(1)}% > 65%`);

console.log(JSON.stringify({
  file,
  rows: rows.length,
  uniqueRejected,
  uniqueRejectedPct: Number((uniqueRejected / Math.max(rows.length, 1) * 100).toFixed(2)),
  maxRejectedSharePct: Number((maxRejectedShare * 100).toFixed(2)),
  identicalAnswerPct: Number((sameAnswerRate * 100).toFixed(2)),
  wordCountOnlyAccuracyPct: Number((lengthOnlyAccuracy * 100).toFixed(2)),
  errors,
  readyForHumanReview: errors.length === 0
}, null, 2));
process.exit(errors.length ? 1 : 0);
