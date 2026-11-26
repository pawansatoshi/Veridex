#!/usr/bin/env node
import fs from "node:fs";
import { pathToFileURL } from "node:url";

export const TARGET_INTENT = "SMART_CONTRACT_AUDIT_GENERAL";
const normalize = (value) => value.normalize("NFC").replace(/\s+/gu, " ").trim();
const chars = (value) => [...normalize(value)].length;
const isHttpUrl = (value) => {
  if (!/^https?:\/\//iu.test(value)) return false;
  try {
    const url = new URL(value);
    return Boolean(url.hostname && !url.username && !url.password);
  } catch {
    return false;
  }
};
const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

function validateTruthSource(row, line, failures) {
  if (!("source" in row) || !(typeof row.source === "string" || isPlainObject(row.source))) {
    failures.push("line " + line + ": truth_source requires source as YAML/JSON text or an object");
    return;
  }
  if ("prompt" in row || "chosen" in row || "rejected" in row) {
    failures.push("line " + line + ": truth_source must not contain prompt, chosen or rejected");
  }
  const serialized = typeof row.source === "string" ? row.source : JSON.stringify(row.source);
  if (Buffer.byteLength(serialized, "utf8") > 32 * 1024) {
    failures.push("line " + line + ": truth source exceeds 32 KiB");
  }
  if (typeof row.source === "string") {
    // This is deliberately a lightweight lint, not a YAML parser. The node's
    // miner-YAML loader remains authoritative for official eligibility.
    if (!/kind:\s*miner/iu.test(row.source)) failures.push("line " + line + ": truth-source YAML must declare kind: miner");
    if (!/auth:\s*(?:\n\s*)?type:\s*none/iu.test(row.source) && !/auth:\s*\{[^}]*type:\s*none/iu.test(row.source)) {
      failures.push("line " + line + ": truth-source YAML must use auth.type: none");
    }
    if (!row.source.includes(TARGET_INTENT) && !/intents:\s*\[[^\]]*\*/iu.test(row.source)) {
      failures.push("line " + line + ": truth-source YAML does not visibly declare the target Intent (or wildcard)");
    }
  } else {
    const source = row.source;
    if (source.version !== "1") failures.push("line " + line + ": truth-source version must be string '1'");
    if (source.kind !== "miner") failures.push("line " + line + ": truth-source object must declare kind=miner");
    if (!Number.isInteger(source.id) || source.id < 0) failures.push("line " + line + ": truth-source id must be a non-negative integer");
    if (typeof source.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(source.slug)) failures.push("line " + line + ": truth-source slug must be kebab-case");
    if (typeof source.name !== "string" || !source.name.trim()) failures.push("line " + line + ": truth-source name is required");
    if (source.auth?.type !== "none") failures.push("line " + line + ": truth-source object must use auth.type=none");
    const endpoints = Array.isArray(source.endpoints) ? source.endpoints : [];
    if (!endpoints.length) failures.push("line " + line + ": truth-source must declare at least one endpoint");
    const servesIntent = endpoints.some((endpoint) =>
      typeof endpoint?.path === "string" &&
      ["GET", "POST", "PUT", "PATCH", "DELETE"].includes(String(endpoint.method).toUpperCase()) &&
      typeof endpoint.description === "string" &&
      Array.isArray(endpoint?.intents) &&
      (endpoint.intents.includes(TARGET_INTENT) || endpoint.intents.includes("*"))
    );
    if (!servesIntent) failures.push("line " + line + ": no complete truth-source endpoint declares the target Intent or wildcard");
    const supported = source.semantics?.supported_intents;
    if (!Array.isArray(supported) || !(supported.includes(TARGET_INTENT) || supported.includes("*"))) {
      failures.push("line " + line + ": semantics.supported_intents must include the target Intent or wildcard");
    }
    const baseUrl = source.base_url;
    if (typeof baseUrl !== "string" || !/^https:\/\//iu.test(baseUrl)) {
      failures.push("line " + line + ": truth-source base_url must be an absolute HTTPS URL");
    }
  }
}

export function validateRows(inputRows, { trainingQuality = true } = {}) {
  const failures = [], warnings = [], rows = [], seenPrompts = new Map();
  let generated = 0, selfDeclaredHumanWithUrl = 0, missingProvenance = 0;
  let preferencePairs = 0, truthSources = 0, groundTruthRows = 0, skipped = 0;

  for (let i = 0; i < inputRows.length; i++) {
    const line = i + 1, row = inputRows[i];
    if (!isPlainObject(row)) {
      failures.push("line " + line + ": row must be an object");
      continue;
    }
    const labelKind = row.label_kind ?? "preference_pair";
    if (!["preference_pair", "ground_truth", "graded_exemplar", "truth_source"].includes(labelKind)) {
      failures.push("line " + line + ": unknown label_kind " + String(labelKind));
      continue;
    }
    if ("intent_id" in row && row.intent_id !== TARGET_INTENT) {
      failures.push("line " + line + ": intent_id must be " + TARGET_INTENT);
    }
    if (Buffer.byteLength(JSON.stringify(row), "utf8") > 64 * 1024) {
      failures.push("line " + line + ": row exceeds 64 KiB");
    }

    if (labelKind === "truth_source") {
      truthSources++;
      validateTruthSource(row, line, failures);
      continue;
    }
    if ("source" in row) failures.push("line " + line + ": source is only valid on a truth_source row");
    if (typeof row.prompt !== "string" || !row.prompt.trim()) {
      failures.push("line " + line + ": question row requires a non-empty prompt");
      continue;
    }
    const prompt = normalize(row.prompt);
    if (chars(row.prompt) < 16 || chars(row.prompt) > 16000) {
      failures.push("line " + line + ": prompt length outside 16..16000");
    }
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(row.prompt)) {
      failures.push("line " + line + ": prompt contains control characters");
    }
    if (seenPrompts.has(prompt)) {
      failures.push("line " + line + ": duplicate normalized prompt (first line " + seenPrompts.get(prompt) + ")");
    } else {
      seenPrompts.set(prompt, line);
    }

    const provenance = isPlainObject(row.provenance) ? row.provenance : {};
    const kind = String(provenance.source_kind ?? "").toLowerCase();
    const url = String(provenance.source_url ?? "");
    if (["llm", "synthetic", "generated", "model"].includes(kind)) generated++;
    else if (kind === "human" && isHttpUrl(url)) selfDeclaredHumanWithUrl++;
    if (!kind || !url) missingProvenance++;

    if (labelKind === "preference_pair") {
      preferencePairs++;
      if (![row.chosen, row.rejected].every((value) => typeof value === "string" && value.trim())) {
        failures.push("line " + line + ": preference_pair requires non-empty chosen and rejected");
        continue;
      }
      for (const [key, value, min, max] of [["chosen", row.chosen, 8, 32000], ["rejected", row.rejected, 8, 32000]]) {
        if (chars(value) < min || chars(value) > max) failures.push("line " + line + ": " + key + " length outside " + min + ".." + max);
        if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value)) failures.push("line " + line + ": " + key + " contains control characters");
      }
      if (normalize(row.chosen) === normalize(row.rejected)) failures.push("line " + line + ": chosen and rejected are identical");
      rows.push({ chosen: normalize(row.chosen), rejected: normalize(row.rejected) });
    } else {
      groundTruthRows++;
      if (typeof row.chosen !== "string" || !row.chosen.trim()) failures.push("line " + line + ": " + labelKind + " requires non-empty chosen");
      if (row.rejected !== undefined && (typeof row.rejected !== "string" || !row.rejected.trim() || normalize(row.chosen) === normalize(row.rejected))) {
        failures.push("line " + line + ": optional rejected must be non-empty and differ from chosen");
      }
      for (const [key, value] of [["chosen", row.chosen], ["rejected", row.rejected]]) {
        if (typeof value !== "string") continue;
        if (chars(value) < 8 || chars(value) > 32000) failures.push("line " + line + ": " + key + " length outside 8..32000");
        if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value)) failures.push("line " + line + ": " + key + " contains control characters");
      }
    }
  }

  const rejectedCounts = new Map();
  for (const row of rows) rejectedCounts.set(row.rejected, (rejectedCounts.get(row.rejected) ?? 0) + 1);
  const n = rows.length, uniqueRate = n ? rejectedCounts.size / n : 0;
  const maxRepeated = n ? Math.max(...rejectedCounts.values()) / n : 0;
  const longer = rows.filter((row) => row.chosen.length > row.rejected.length).length;
  const ties = rows.filter((row) => row.chosen.length === row.rejected.length).length;
  const longerAccuracy = n ? (longer + ties * 0.5) / n : 0.5;
  const lengthShortcut = Math.max(longerAccuracy, 1 - longerAccuracy);

  if (!preferencePairs && !truthSources && !groundTruthRows) failures.push("no usable evaluation material");
  if (trainingQuality && n && uniqueRate < 0.80) failures.push("unique rejected answers " + (uniqueRate * 100).toFixed(1) + "% < 80%");
  if (trainingQuality && n && maxRepeated > 0.02) failures.push("most-repeated rejected answer share " + (maxRepeated * 100).toFixed(1) + "% > 2%");
  if (trainingQuality && n && lengthShortcut > 0.65) failures.push("length-only shortcut " + (lengthShortcut * 100).toFixed(1) + "% > 65%");
  if (generated) warnings.push(generated + " generated/model rows are unverified and must never be relabelled as human");
  if (missingProvenance) warnings.push(missingProvenance + " question rows lack source_kind or source_url");
  if (selfDeclaredHumanWithUrl) warnings.push(selfDeclaredHumanWithUrl + " rows self-declare human provenance plus an HTTP(S) URL; this is not independently authenticated");
  if (!preferencePairs) warnings.push("No preference pairs exist; adapter training cannot proceed from this dataset.");
  if (!truthSources) warnings.push("No truth-source row exists; the checkable half of this Hybrid Intent may remain unscored.");
  warnings.push("Hybrid question material requires at least five distinct eligible contributors in the live pool; verify evalpool status after authorized uploads.");
  warnings.push("Run the compatible official adapter kit --check-data and inspect every row's live eligible/rejected state. Local validation is not network acceptance.");

  const ok = failures.length === 0;
  return {
    ok,
    intentId: TARGET_INTENT,
    intentClass: "hybrid_catalogue_classification_live_node_confirmation_required",
    usableRows: preferencePairs + groundTruthRows + truthSources,
    material: { preferencePairs, groundTruthRows, truthSources },
    metrics: {
      uniqueRejectedFraction: n ? Number(uniqueRate.toFixed(4)) : null,
      maxRejectedShare: n ? Number(maxRepeated.toFixed(4)) : null,
      lengthShortcutAccuracy: n ? Number(lengthShortcut.toFixed(4)) : null
    },
    provenance: { selfDeclaredHumanWithUrl, generatedUnverified: generated, missing: missingProvenance },
    poolRequirements: { minQuestionContributors: 5, truthSourceMinimum: 1, liveEligibilityVerified: false },
    failures,
    warnings,
    readyForLocalPreflight: ok,
    readyForPoolSubmission: false,
    submissionReadiness: "requires_live_schema_confirmation_human_adjudication_and_network_eligibility"
  };
}

function main() {
  const args = process.argv.slice(2), at = args.indexOf("--input");
  if (at < 0 || !args[at + 1]) {
    console.error("Usage: node scripts/validate-smart-contract-audit-data.mjs --input <evaluation-material.jsonl>");
    process.exit(2);
  }
  const file = args[at + 1], rows = [], parseFailures = [];
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/u).filter((line) => line.trim());
  for (let i = 0; i < lines.length; i++) {
    try { rows.push(JSON.parse(lines[i])); }
    catch { parseFailures.push("line " + (i + 1) + ": invalid JSON"); }
  }
  const result = validateRows(rows);
  result.failures.unshift(...parseFailures);
  result.ok = result.failures.length === 0;
  result.readyForLocalPreflight = result.ok;
  result.readyForPoolSubmission = false;
  console.log(JSON.stringify({ file, ...result }, null, 2));
  process.exit(result.ok ? 0 : 1);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
