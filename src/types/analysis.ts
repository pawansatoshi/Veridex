import type { CertaintyStatus, EvidenceFailureKind, EvidenceProvenance } from "../domain/evidence.js";

export type DetectionMethod =
  | "verified_abi"
  | "verified_source"
  | "bytecode_fallback"
  | "direct_onchain";

export type CheckStatus =
  | "positive"
  | "negative"
  | "inapplicable"
  | "unavailable"
  | "error";

export interface CheckResult<Evidence = Record<string, unknown>> {
  checkName: string;
  passed: boolean;
  status: CheckStatus;
  confidence: number;
  evidence: Evidence;
  certaintyStatus?: CertaintyStatus;
  failure?: EvidenceFailureKind;
  provenance?: EvidenceProvenance;
  error?: string;
  detectionMethod?: DetectionMethod;
  fallbackReason?: string;
  fallbackDetail?: string;
}

export interface ContractTarget {
  contractAddress: string;
  codeAddress?: string;
}

export interface ProxyEvidence {
  isProxy: boolean;
  proxyType?: "transparent" | "uups" | "beacon" | "unknown";
  implementationAddress?: string;
  beaconAddress?: string;
}

export interface CapabilityEvidence {
  capability: string;
  detected: boolean;
  scannedAddress?: string;
  tier1Unavailable?: "not_configured" | "unverified_contract" | "api_failure";
  tier1Detail?: string;
}

export interface ContractAnalysis {
  contractAddress: string;
  implementationAddress?: string;
  checks: CheckResult[];
}
