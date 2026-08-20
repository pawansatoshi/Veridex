import { createHash } from "node:crypto";
import type { NormalizedAnalysis, NormalizedCapability } from "./analyzer.js";

export type PassportPosture = "established" | "partial" | "inconclusive";

export interface PassportCapability {
  capability: NormalizedCapability["capability"];
  result: NormalizedCapability["result"];
  confidence: number;
  conclusive: boolean;
  detectionMethod: NormalizedCapability["detectionMethod"];
  evidence: Record<string, unknown>;
  fallbackReason?: string;
}

export interface CapabilityPassport {
  schema: "veridex.capability-passport.v1";
  subject: {
    chain: string;
    requestedAddress: string;
    contractAddress: string;
    codeAddress?: string;
  };
  identity: {
    passportId: string;
    evidenceFingerprint: string;
    observedAt: string;
  };
  posture: {
    state: PassportPosture;
    confidence: number;
    conclusive: boolean;
  };
  capabilities: readonly PassportCapability[];
  composition: {
    status: NormalizedAnalysis["proxy"]["status"];
    codeAddress?: string;
    evidence: Record<string, unknown>;
  };
  verification: {
    status: NormalizedAnalysis["verification"]["status"];
    evidence: NormalizedAnalysis["verification"];
  };
  provider: NormalizedAnalysis["providerStatus"];
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  }
  return value;
}

function fingerprint(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

function passportId(analysis: NormalizedAnalysis): string {
  return `vp_${fingerprint({
    chain: analysis.contract.chain,
    contractAddress: analysis.contract.contractAddress.toLowerCase(),
  }).slice(0, 24)}`;
}

function postureFor(analysis: NormalizedAnalysis): PassportPosture {
  if (analysis.conclusive && analysis.capabilities.every((item) => item.conclusive)) return "established";
  if (analysis.capabilities.some((item) => item.conclusive)) return "partial";
  return "inconclusive";
}

/**
 * Builds a canonical, evidence-backed capability identity from one observation.
 * This function never invents historical state; `observedAt` identifies the
 * observation time only. Persistence and historical diffs belong to later phases.
 */
export function buildCapabilityPassport(
  analysis: NormalizedAnalysis,
  observedAt = new Date().toISOString(),
): CapabilityPassport {
  const capabilities = analysis.capabilities.map((item) => ({
    capability: item.capability,
    result: item.result,
    confidence: item.confidence,
    conclusive: item.conclusive,
    detectionMethod: item.detectionMethod,
    evidence: item.evidence,
    ...(item.fallbackReason !== undefined ? { fallbackReason: item.fallbackReason } : {}),
  }));

  const evidenceFingerprint = fingerprint({
    subject: analysis.contract,
    proxy: analysis.proxy,
    verification: analysis.verification,
    capabilities,
    providerStatus: analysis.providerStatus,
  });

  return {
    schema: "veridex.capability-passport.v1",
    subject: analysis.contract,
    identity: {
      passportId: passportId(analysis),
      evidenceFingerprint,
      observedAt,
    },
    posture: {
      state: postureFor(analysis),
      confidence: analysis.confidence,
      conclusive: analysis.conclusive,
    },
    capabilities,
    composition: {
      status: analysis.proxy.status,
      ...(analysis.proxy.codeAddress !== undefined ? { codeAddress: analysis.proxy.codeAddress } : {}),
      evidence: analysis.proxy.evidence,
    },
    verification: {
      status: analysis.verification.status,
      evidence: analysis.verification,
    },
    provider: analysis.providerStatus,
  };
}

export function passportIdentityKey(passport: CapabilityPassport): string {
  return `${passport.identity.passportId}:${passport.identity.evidenceFingerprint}`;
}
