export type VerificationStatus =
  | "verified"
  | "unverified_contract"
  | "not_configured"
  | "api_failure"
  | "timeout"
  | "malformed_response";

export interface VerifiedContractData {
  abi?: readonly unknown[];
  sourceCode?: string;
  contractName?: string;
  compilerVersion?: string;
}

export interface VerificationProviderResult {
  status: VerificationStatus;
  data?: VerifiedContractData;
  detail?: string;
  httpStatus?: number;
  retryAfterMs?: number;
}

export interface VerificationProvider {
  lookup(contractAddress: string): Promise<VerificationProviderResult>;
}

export interface VerificationEvidence {
  status: VerificationStatus;
  contractAddress: string;
  verified: boolean;
  abiAvailable: boolean;
  sourceAvailable: boolean;
  /** Provider-derived ABI retained for deterministic capability analysis; never caller-supplied. */
  abi?: readonly unknown[];
  contractName?: string;
  compilerVersion?: string;
  detail?: string;
  httpStatus?: number;
  retryAfterMs?: number;
  provenance: "verified_abi" | "verified_source" | "none";
}

/** Safe default: absence of a provider is not evidence that a contract is unverified. */
export class NotConfiguredVerificationProvider implements VerificationProvider {
  public async lookup(_contractAddress: string): Promise<VerificationProviderResult> {
    return { status: "not_configured", detail: "No verification provider is configured" };
  }
}

/**
 * Converts provider output into a stable evidence object without silently
 * turning provider failures into negative contract findings.
 */
export function normalizeVerificationEvidence(
  contractAddress: string,
  result: VerificationProviderResult,
): VerificationEvidence {
  const data = result.data;
  const abiAvailable = Array.isArray(data?.abi) && data.abi.length > 0;
  const sourceAvailable = typeof data?.sourceCode === "string" && data.sourceCode.length > 0;

  return {
    status: result.status,
    contractAddress,
    verified: result.status === "verified",
    abiAvailable,
    sourceAvailable,
    ...(abiAvailable ? { abi: data?.abi as readonly unknown[] } : {}),
    ...(data?.contractName !== undefined ? { contractName: data.contractName } : {}),
    ...(data?.compilerVersion !== undefined ? { compilerVersion: data.compilerVersion } : {}),
    ...(result.detail !== undefined ? { detail: result.detail } : {}),
    ...(result.httpStatus !== undefined ? { httpStatus: result.httpStatus } : {}),
    ...(result.retryAfterMs !== undefined ? { retryAfterMs: result.retryAfterMs } : {}),
    provenance: abiAvailable ? "verified_abi" : sourceAvailable ? "verified_source" : "none",
  };
}

export class VerificationClient {
  public constructor(
    private readonly provider: VerificationProvider,
    private readonly timeoutMs = 8_000,
  ) {
    if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) {
      throw new Error("Verification timeout must be an integer in [100, 30000]");
    }
  }

  public async lookup(contractAddress: string): Promise<VerificationEvidence> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const result = await Promise.race([
        this.provider.lookup(contractAddress),
        new Promise<VerificationProviderResult>((resolve) => {
          timer = setTimeout(() => resolve({ status: "timeout", detail: "Verification provider timed out" }), this.timeoutMs);
        }),
      ]);
      return normalizeVerificationEvidence(contractAddress, result);
    } catch (error) {
      return normalizeVerificationEvidence(contractAddress, {
        status: "api_failure",
        detail: error instanceof Error ? error.message : String(error),
      });
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }
}
