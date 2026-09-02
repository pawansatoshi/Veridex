import type { NormalizedAnalysis } from "../domain/analyzer.js";
import { buildCapabilityIntelligence } from "../domain/capabilityIntelligence.js";
import { buildCapabilityPassport } from "../domain/capabilityPassport.js";
import { minerDependencies } from "../miner/runtime.js";
import { normalizeMinerRequest } from "../miner/request.js";
import { askTelegraph, loadTelegraphClientOptions, type TelegraphAskResult } from "../telegraph/client.js";

export type TelegraphAssessment = "supports" | "contradicts" | "inconclusive" | "invalid";

export interface ParsedTelegraphReview {
  assessment: TelegraphAssessment;
  riskLevel: "low" | "medium" | "high" | "unknown";
  confidence: number | null;
  reasons: string[];
}

export interface Track3Decision {
  status: "CORROBORATED" | "CONFLICTED" | "DETERMINISTIC_ONLY" | "INCONCLUSIVE";
  label: string;
  rationale: string;
}

export interface Track3Result {
  schema: "veridex.track3.application.v1";
  requestId: string;
  analysis: NormalizedAnalysis;
  capabilityIntelligence: ReturnType<typeof buildCapabilityIntelligence>;
  capabilityPassport: ReturnType<typeof buildCapabilityPassport>;
  telegraph: {
    status: "settled" | "required" | "not_required" | "unavailable" | "failed";
    review: ParsedTelegraphReview;
    rawResult: unknown;
    intent?: string;
    miner?: string;
    minerName?: string;
    costUsd?: number;
    durationMs?: number;
    paymentNetwork?: string;
    paymentAmountAtomic?: string;
    paymentProof?: { transaction?: string; network?: string; payer?: string; success?: boolean };
  };
  decision: Track3Decision;
  evidence: Array<{
    source: "veridex" | "telegraph";
    type: "deterministic" | "independent_review";
    status: "available" | "unavailable" | "inconclusive";
    summary: string;
    details: Record<string, unknown>;
  }>;
}

const MAX_QUERY_CONTEXT_CHARS = 6_000;

function clampConfidence(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  if (!Number.isFinite(parsed)) return null;
  if (parsed < 0 || parsed > 1) return null;
  return parsed;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function tryParseJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Keep searching. An unstructured provider response is treated as inconclusive.
    }
  }
  return value;
}

function extractReview(raw: unknown): ParsedTelegraphReview {
  const parsed = tryParseJson(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { assessment: "invalid", riskLevel: "unknown", confidence: null, reasons: [] };
  }

  const root = parsed as Record<string, unknown>;
  const candidate = (root.review && typeof root.review === "object" && !Array.isArray(root.review))
    ? root.review as Record<string, unknown>
    : root;
  const assessment = text(candidate.assessment)?.toLowerCase();
  const normalizedAssessment: TelegraphAssessment = assessment === "supports" || assessment === "contradicts" || assessment === "inconclusive"
    ? assessment
    : "invalid";
  const risk = text(candidate.riskLevel ?? candidate.risk)?.toLowerCase();
  const riskLevel = risk === "low" || risk === "medium" || risk === "high" ? risk : "unknown";
  const rawReasons = candidate.reasons;
  const reasons = Array.isArray(rawReasons)
    ? rawReasons.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 6)
    : text(candidate.reason) ? [text(candidate.reason)!] : [];

  return {
    assessment: normalizedAssessment,
    riskLevel,
    confidence: clampConfidence(candidate.confidence),
    reasons,
  };
}

function buildReviewQuery(analysis: NormalizedAnalysis): { query: string; context: Record<string, unknown> } {
  const signals = analysis.capabilities.map((item) => ({
    capability: item.capability,
    result: item.result,
    confidence: item.confidence,
    conclusive: item.conclusive,
    evidenceKind: item.evidence.kind,
  }));

  const compact = JSON.stringify({
    contract: analysis.contract.contractAddress,
    chain: analysis.contract.chain,
    deterministicState: analysis.conclusive ? "conclusive" : "partial",
    deterministicConfidence: analysis.confidence,
    capabilities: signals,
  }).slice(0, MAX_QUERY_CONTEXT_CHARS);

  return {
    query: [
      "You are the independent secondary reviewer in an evidence-first on-chain intelligence application.",
      "Review ONLY the supplied deterministic observations. Do not invent balances, owners, source-code facts, transactions, vulnerabilities, or other chain facts that are not present.",
      "Decide whether your review supports the deterministic posture, contradicts it, or is inconclusive.",
      "Return JSON only with this exact shape:",
      '{"assessment":"supports|contradicts|inconclusive","riskLevel":"low|medium|high|unknown","confidence":0.0,"reasons":["..."]}',
      "The confidence is your review confidence, not a probability of loss.",
    ].join(" "),
    context: { veridex_observations: compact },
  };
}

function decide(analysis: NormalizedAnalysis, review: ParsedTelegraphReview, telegraphAvailable: boolean): Track3Decision {
  if (!telegraphAvailable) {
    return {
      status: "DETERMINISTIC_ONLY",
      label: "Deterministic evidence only",
      rationale: "Telegraph intelligence was not available, so no secondary conclusion was substituted for the primary evidence model.",
    };
  }
  if (review.assessment === "contradicts") {
    return {
      status: "CONFLICTED",
      label: "Evidence conflict requires review",
      rationale: "The live Telegraph review explicitly contradicted the deterministic posture. Veridex preserves the disagreement instead of forcing a single security conclusion.",
    };
  }
  if (review.assessment === "supports" && analysis.conclusive) {
    return {
      status: "CORROBORATED",
      label: "Deterministic evidence corroborated",
      rationale: "The deterministic evidence is conclusive under the Veridex model and the live Telegraph review independently supports that posture.",
    };
  }
  if (!analysis.conclusive || review.assessment === "inconclusive" || review.assessment === "invalid") {
    return {
      status: "INCONCLUSIVE",
      label: "Evidence remains incomplete",
      rationale: "The available evidence does not justify a fully corroborated conclusion.",
    };
  }
  return {
    status: "DETERMINISTIC_ONLY",
    label: "Deterministic evidence leads",
    rationale: "The deterministic evidence is usable, but the Telegraph review did not produce a compatible structured assessment.",
  };
}

function telegraphError(result: TelegraphAskResult | undefined): "settled" | "required" | "not_required" | "unavailable" | "failed" {
  if (!result) return "failed";
  return result.metadata.payment;
}

export async function runTrack3Analysis(body: unknown): Promise<Track3Result> {
  const input = normalizeMinerRequest(body);
  if (!input) throw new Error("invalid_request");

  const analysis = await minerDependencies.analyze(input);
  const capabilityIntelligence = buildCapabilityIntelligence(analysis);
  const capabilityPassport = buildCapabilityPassport(analysis);
  const reviewQuery = buildReviewQuery(analysis);
  let telegraphResult: TelegraphAskResult | undefined;
  let telegraphErrorMessage: string | undefined;

  try {
    telegraphResult = await askTelegraph(reviewQuery.query, reviewQuery.context);
  } catch (error) {
    telegraphErrorMessage = error instanceof Error ? error.message : String(error);
  }

  const telegraphResponse = telegraphResult?.response;
  const review = extractReview(telegraphResponse?.result);
  const telegraphAvailable = Boolean(telegraphResult && ["settled", "required", "not_required"].includes(telegraphResult.metadata.payment));
  const decision = decide(analysis, review, telegraphAvailable);
  const requestId = telegraphResult?.metadata.requestId ?? crypto.randomUUID();

  const evidence: Track3Result["evidence"] = [
    {
      source: "veridex",
      type: "deterministic",
      status: analysis.capabilities.length > 0 ? "available" : "inconclusive",
      summary: "Primary contract observations from the Veridex evidence model.",
      details: { conclusive: analysis.conclusive, confidence: analysis.confidence, capabilityCount: analysis.capabilities.length },
    },
    {
      source: "telegraph",
      type: "independent_review",
      status: telegraphAvailable && review.assessment !== "invalid" ? "available" : "inconclusive",
      summary: telegraphAvailable
        ? "Live Telegraph Miner response used as a secondary review signal."
        : "No usable live Telegraph review was available; this is not treated as a negative finding.",
      details: telegraphErrorMessage ? { error: telegraphErrorMessage } : { assessment: review.assessment, riskLevel: review.riskLevel, confidence: review.confidence },
    },
  ];

  return {
    schema: "veridex.track3.application.v1",
    requestId,
    analysis,
    capabilityIntelligence,
    capabilityPassport,
    telegraph: {
      status: telegraphError(telegraphResult),
      review,
      rawResult: telegraphResponse?.result ?? null,
      ...(text(telegraphResponse?.intent) ? { intent: telegraphResponse?.intent } : {}),
      ...(text(telegraphResponse?.miner_used) ? { miner: telegraphResponse?.miner_used } : {}),
      ...(text(telegraphResponse?.miner_name) ? { minerName: telegraphResponse?.miner_name } : {}),
      ...(typeof telegraphResponse?.cost_usd === "number" ? { costUsd: telegraphResponse.cost_usd } : {}),
      ...(typeof telegraphResponse?.duration_ms === "number" ? { durationMs: telegraphResponse.duration_ms } : {}),
      ...(telegraphResult?.metadata.paymentNetwork ? { paymentNetwork: telegraphResult.metadata.paymentNetwork } : {}),
      ...(telegraphResult?.metadata.paymentAmountAtomic ? { paymentAmountAtomic: telegraphResult.metadata.paymentAmountAtomic } : {}),
      ...(telegraphResult?.metadata.paymentProof ? { paymentProof: telegraphResult.metadata.paymentProof } : {}),
    },
    decision,
    evidence,
  };
}

export { buildReviewQuery, extractReview, decide };
