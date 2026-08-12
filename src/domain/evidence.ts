export type EvidenceFailureKind =
  | "not_configured"
  | "unverified_contract"
  | "external_api_failure"
  | "rate_limited"
  | "timeout"
  | "malformed_response"
  | "insufficient_evidence"
  | "unsupported"
  | "rpc_revert"
  | "provider_failure";

export type CertaintyStatus = "conclusive" | "inconclusive";

export type EvidenceTier = "verified_abi" | "verified_source" | "bytecode_fallback" | "direct_onchain";

export interface EvidenceProvenance {
  tier: EvidenceTier;
  method: string;
  queriedAddress?: string;
  codeAddress?: string;
  source?: string;
  observedAt: string;
  failure?: EvidenceFailureKind;
  detail?: string;
}

export interface Evidence<T = unknown> {
  observation: T;
  provenance: EvidenceProvenance;
}

export function nowIso(): string {
  return new Date().toISOString();
}
