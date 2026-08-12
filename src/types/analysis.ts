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

/**
 * Shared contract for deterministic Veridex checks.
 *
 * `passed` means that the check found no risk signal for its own domain;
 * it does not mean that the request or RPC operation succeeded.
 *
 * Confidence is a [0, 1] value expressing confidence in the check's
 * conclusion given its evidence. Existing checks should retain their
 * calibrated values until an explicit scoring model is designed.
 */
export interface CheckResult<Evidence = Record<string, unknown>> {
  checkName: string;
  passed: boolean;
  status: CheckStatus;
  confidence: number;
  evidence: Evidence;
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
