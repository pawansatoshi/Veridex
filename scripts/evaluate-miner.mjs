#!/usr/bin/env node

/**
 * Deterministic, submission-grade quality evaluator for Veridex Miner evidence.
 * This is an internal quality score, not an imitation of Telegraph's ranking.
 * Input: a real-chain ground-truth report produced by verify-real-chain.mjs.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";

const inputPath = process.env.VERIDEX_EVAL_INPUT ?? "artifacts/real-chain-ground-truth.json";
const outputPath = process.env.VERIDEX_EVAL_OUTPUT ?? "artifacts/miner-evaluation.json";
const minimumAccuracy = Number.parseFloat(process.env.VERIDEX_EVAL_MIN_ACCURACY ?? "0.95");
const minimumEvidenceCoverage = Number.parseFloat(process.env.VERIDEX_EVAL_MIN_EVIDENCE ?? "0.95");
const minimumQualityScore = Number.parseFloat(process.env.VERIDEX_EVAL_MIN_SCORE ?? "0.90");

if (![minimumAccuracy, minimumEvidenceCoverage, minimumQualityScore].every(Number.isFinite)) throw new Error("evaluation thresholds must be numeric");

const report = JSON.parse(await readFile(inputPath, "utf8"));
if (report.schema !== "veridex.real-chain-ground-truth.v2") throw new Error("unsupported ground-truth report schema");

const cases = Array.isArray(report.cases) ? report.cases : [];
const observations = cases.flatMap((item) => Object.values(item.evaluation?.observations ?? {}));
const classified = observations.filter((item) => ["true_positive", "true_negative", "false_positive", "false_negative"].includes(item.classification));
const correct = classified.filter((item) => item.classification === "true_positive" || item.classification === "true_negative").length;
const accuracy = classified.length === 0 ? 0 : correct / classified.length;

const evidenceChecks = cases.flatMap((item) => {
  const capabilities = Array.isArray(item.observed?.capabilities) ? item.observed.capabilities : [];
  return capabilities.map((capability) => {
    const evidence = capability?.evidence;
    const present = evidence !== null && typeof evidence === "object" && !Array.isArray(evidence) && Object.keys(evidence).length > 0;
    return { present, capability: capability?.capability, caseId: item.id };
  });
});
const evidenceCoverage = evidenceChecks.length === 0 ? 0 : evidenceChecks.filter((item) => item.present).length / evidenceChecks.length;

const conclusive = observations.filter((item) => item.classification !== "inconclusive" && item.classification !== "unavailable" && item.classification !== "error").length;
const conclusiveRate = observations.length === 0 ? 0 : conclusive / observations.length;
const errorCount = observations.filter((item) => item.classification === "error" || item.classification === "unavailable").length;
const falsePositive = classified.filter((item) => item.classification === "false_positive").length;
const falseNegative = classified.filter((item) => item.classification === "false_negative").length;

const qualityScore = (accuracy * 0.55) + (evidenceCoverage * 0.25) + (conclusiveRate * 0.20);
const passed = accuracy >= minimumAccuracy && evidenceCoverage >= minimumEvidenceCoverage && qualityScore >= minimumQualityScore && errorCount === 0 && falsePositive === 0 && falseNegative === 0;

const result = {
  schema: "veridex.miner-evaluation.v1",
  kind: "internal-quality-gate",
  generatedAt: new Date().toISOString(),
  source: inputPath,
  thresholds: { minimumAccuracy, minimumEvidenceCoverage, minimumQualityScore },
  corpus: { cases: cases.length, observations: observations.length, classified: classified.length },
  metrics: {
    accuracy,
    evidenceCoverage,
    conclusiveRate,
    falsePositive,
    falseNegative,
    errorCount,
    qualityScore,
  },
  passed,
  interpretation: passed
    ? "Miner meets the deterministic Veridex quality gate. This does not represent an official Telegraph ranking."
    : "Miner quality gate failed; inspect ground-truth cases and evidence before submission.",
};

await mkdir(outputPath.split("/").slice(0, -1).join("/") || ".", { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result, null, 2));
if (!passed) process.exit(1);
