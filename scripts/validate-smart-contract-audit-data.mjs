#!/usr/bin/env node
/**
 * Validate Telegraph SMART_CONTRACT_AUDIT preference pairs before upload.
 * Local quality gate only; not a substitute for human review or node curation.
 */
import fs from "node:fs";

const args = process.argv.slice(2);
const flag = args.indexOf("--input");
if (flag < 0 || !args[flag + 1]) {
  console.error("Usage: node scripts/validate-smart-contract-audit-data.mjs --input <pairs.jsonl>");
  process.exit(2);
}
const file = args[flag + 1];
const lines = fs.readFileSync(file, "utf8").split(/\r?\n/).filter((line) => line.trim());
const errors = [];
const rows = [];

for (let i = 0; i < lines.length; i++) {
  const lineNo = i + 1;
  let row;
  try { row = JSON.parse(lines[i]); }
  catch { errors.push(`line ${lineNo}: invalid JSON`); continue; }
  for (const key of ["prompt", "chosen", "rejected"]) {
    if (typeof row[key] !== "string" || !row[key].trim()) errors.push(`line ${lineNo}: missing/non-string ${key}`);
  }
  if (["prompt", "chosen", "rejected"].some((key) => typeof row[key] !== "string")) continue;
  if (row.label_kind && row.label_kind !== "preference_pair") errors.push(`line ${lineNo}: label_kind must be preference_pair`);
  if (row.intent_id && row.intent_id !== "SMART_CONTRACT_AUDIT_GENERAL") errors.push(`line ${lineNo}: wrong intent_id`);
  if (row.prompt.length < 16 || row.prompt.length > 16000) errors.push(`line ${lineNo}: prompt length outside 16..16000`);
  for (const key of ["chosen", "rejected"]) {
    if (row[key].length < 8 || row[key].length > 32000) errors.push(`line ${lineNo}: ${key} length outside 8..32000`);
  }
  if (row.chosen === row.rejected) errors.push(`line ${lineNo}: chosen and rejected are identical`);
  const p = row.provenance;
  if (!p || typeof p !== "object" || typeof p.source_kind !== "string" || typeof p.source_url !== "string") {
    errors.push(`line ${lineNo}: provenance.source_kind and provenance.source_url are required`);
  } else {
    if (["llm", "synthetic", "generated", "model"].includes(p.source_kind.toLowerCase())) {
      errors.push(`line ${lineNo}: generated provenance is unverified; do not present it as attested human material`);
    }
    try {
      if (new URL(p.source_url).protocol !== "https:") errors.push(`line ${lineNo}: provenance URL must use https`);
    } catch { errors.push(`line ${lineNo}: invalid provenance URL`); }
  }
  rows.push(row);
}

const normalize = (s) => s.normalize("NFC").replace(/\s+/g, " ").trim().toLowerCase();
const seenPrompts = new Map();
const rejectedCounts = new Map();
let identicalAnswers = 0;
let longerChosen = 0;
let shorterChosen = 0;
let equalLength = 0;

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  const prompt = normalize(row.prompt);
  if (seenPrompts.has(prompt)) errors.push(`duplicate normalized prompt at rows ${seenPrompts.get(prompt)} and ${i + 1}`);
  else seenPrompts.set(prompt, i + 1);
  rejectedCounts.set(row.rejected, (rejectedCounts.get(row.rejected) ?? 0) + 1);
  if (row.chosen === row.rejected) identicalAnswers++;
  const chosenWords = row.chosen.trim().split(/\s+/).length;
  const rejectedWords = row.rejected.trim().split(/\s+/).length;
  if (chosenWords > rejectedWords) longerChosen++;
  else if (chosenWords < rejectedWords) shorterChosen++;
  else equalLength++;
}

const n = rows.length;
const uniqueRejected = rejectedCounts.size;
const maxRejectedShare = n ? Math.max(...rejectedCounts.values()) / n : 1;
const identicalRate = n ? identicalAnswers / n : 1;
// Pairwise length-only baseline: choose whichever direction (longer or shorter)
// is more predictive; ties are counted as half-correct.
const lengthOnlyAccuracy = n
  ? Math.max((longerChosen + equalLength * 0.5) / n, (shorterChosen + equalLength * 0.5) / n)
  : 1;

if (n < 50) errors.push(`only ${n} pairs; need at least 50 for the local diversity gate (training needs substantially more)`);
if (n && uniqueRejected / n < 0.8) errors.push(`unique rejected answers ${(uniqueRejected / n * 100).toFixed(1)}% < 80%`);
if (maxRejectedShare > 0.02) errors.push(`most-repeated rejected answer share ${(maxRejectedShare * 100).toFixed(1)}% > 2%`);
if (identicalRate > 0.01) errors.push(`identical answer rate ${(identicalRate * 100).toFixed(1)}% > 1%`);
if (lengthOnlyAccuracy > 0.65) errors.push(`word-count-only pairwise accuracy ${(lengthOnlyAccuracy * 100).toFixed(1)}% > 65%`);

console.log(JSON.stringify({
  file, rows: n, uniqueRejected,
  uniqueRejectedPct: Number((uniqueRejected / Math.max(n, 1) * 100).toFixed(2)),
  maxRejectedSharePct: Number((maxRejectedShare * 100).toFixed(2)),
  identicalAnswerPct: Number((identicalRate * 100).toFixed(2)),
  wordCountOnlyAccuracyPct: Number((lengthOnlyAccuracy * 100).toFixed(2)),
  errors, readyForHumanReview: errors.length === 0
}, null, 2));
process.exit(errors.length ? 1 : 0);
