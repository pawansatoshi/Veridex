import { assertEvmAddress } from "../domain/address.js";
import type { VerificationProvider, VerificationProviderResult } from "./verification.js";

export interface SourcifyProviderOptions {
  chainId: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Public Sourcify v2 lookup provider. It is intentionally read-only: no
 * verification submissions are performed by Veridex.
 */
export class SourcifyVerificationProvider implements VerificationProvider {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  public constructor(private readonly options: SourcifyProviderOptions) {
    if (!/^\d+$/.test(options.chainId)) throw new Error("Sourcify chainId must be a numeric string");
    this.baseUrl = (options.baseUrl ?? "https://sourcify.dev/server").replace(/\/$/, "");
    this.timeoutMs = options.timeoutMs ?? 7_500;
    if (!Number.isInteger(this.timeoutMs) || this.timeoutMs < 100 || this.timeoutMs > 30_000) {
      throw new Error("Sourcify timeout must be an integer in [100, 30000]");
    }
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  public async lookup(contractAddress: string): Promise<VerificationProviderResult> {
    assertEvmAddress(contractAddress, "contract address");
    const url = `${this.baseUrl}/v2/contract/${this.options.chainId}/${contractAddress}?fields=abi,compilation`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(url, {
        method: "GET",
        headers: { accept: "application/json" },
        signal: controller.signal,
      });

      if (response.status === 404) {
        return { status: "unverified_contract", httpStatus: 404, detail: "Sourcify has no verified contract record" };
      }
      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const retryAfterMs = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1_000 : undefined;
        return { status: "api_failure", httpStatus: 429, retryAfterMs, detail: "Sourcify rate limit" };
      }
      if (!response.ok) {
        return { status: "api_failure", httpStatus: response.status, detail: `Sourcify HTTP ${response.status}` };
      }

      let payload: unknown;
      try {
        payload = await response.json();
      } catch {
        return { status: "malformed_response", httpStatus: response.status, detail: "Sourcify response was not valid JSON" };
      }

      if (typeof payload !== "object" || payload === null) {
        return { status: "malformed_response", httpStatus: response.status, detail: "Sourcify response was not an object" };
      }

      const record = payload as Record<string, unknown>;
      const match = record.match;
      const abi = record.abi;
      if (match !== "exact_match" && match !== "match") {
        return { status: "unverified_contract", httpStatus: response.status, detail: "Sourcify record is not a verified runtime match" };
      }
      if (!Array.isArray(abi) || abi.length === 0) {
        return { status: "verified", httpStatus: response.status, detail: "Verified Sourcify record has no ABI field" };
      }

      const compilation = typeof record.compilation === "object" && record.compilation !== null
        ? record.compilation as Record<string, unknown>
        : undefined;
      const compilerVersion = typeof compilation?.compilerVersion === "string" ? compilation.compilerVersion : undefined;

      return {
        status: "verified",
        httpStatus: response.status,
        data: {
          abi,
          ...(compilerVersion !== undefined ? { compilerVersion } : {}),
        },
        detail: match === "exact_match" ? "Sourcify exact runtime match" : "Sourcify verified runtime match",
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return { status: "timeout", detail: "Sourcify request timed out" };
      }
      return { status: "api_failure", detail: error instanceof Error ? error.message : String(error) };
    } finally {
      clearTimeout(timer);
    }
  }
}
