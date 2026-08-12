import { assertEvmAddress } from "../domain/address.js";
import { ExternalCallError, CircuitBreaker, withResilience } from "./resilience.js";

export interface VerifiedFunction { type: "function"; name: string; inputs: readonly { name?: string; type: string }[]; stateMutability?: string; }
export type VerificationResult =
  | { status: "verified"; abi: readonly VerifiedFunction[]; source?: string }
  | { status: "unverified"; detail: string }
  | { status: "unavailable"; detail: string };
export interface VerificationClient { getContract(address: string): Promise<VerificationResult>; }
interface EtherscanResponse { status?: string; message?: string; result?: unknown; }

function isUnverified(message: string | undefined, result: unknown): boolean { const resultText = typeof result === "string" ? result : ""; return /(?:not verified|source code.*not verified)/i.test(`${message ?? ""} ${resultText}`); }
function resultDetail(response: EtherscanResponse, fallback: string): string { if (typeof response.result === "string" && response.result.length > 0) return response.result; return response.message ?? fallback; }

function parseAbi(value: unknown): readonly VerifiedFunction[] {
  if (typeof value !== "string") throw new Error("Verification ABI result must be a JSON string");
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new Error("Verification ABI is not valid JSON"); }
  if (!Array.isArray(parsed)) throw new Error("Verification ABI must be an array");
  if (parsed.length > 10_000) throw new Error("Verification ABI contains too many entries");
  const functions: VerifiedFunction[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) throw new Error("Verification ABI contains a malformed entry");
    const entry = item as Record<string, unknown>;
    if (entry.type !== "function") continue;
    if (typeof entry.name !== "string" || entry.name.length === 0 || entry.name.length > 256) throw new Error("Verification ABI contains an invalid function name");
    if (!Array.isArray(entry.inputs) || entry.inputs.length > 128) throw new Error("Verification ABI contains invalid function inputs");
    const inputs = entry.inputs.map((input) => {
      if (typeof input !== "object" || input === null) throw new Error("Verification ABI contains a malformed input");
      const record = input as Record<string, unknown>;
      if (typeof record.type !== "string" || record.type.length === 0 || record.type.length > 256) throw new Error("Verification ABI contains an invalid input type");
      const result: { name?: string; type: string } = { type: record.type };
      if (typeof record.name === "string") result.name = record.name;
      return result;
    });
    const functionResult: VerifiedFunction = { type: "function", name: entry.name, inputs };
    if (typeof entry.stateMutability === "string") functionResult.stateMutability = entry.stateMutability;
    functions.push(functionResult);
  }
  return functions;
}

export class EtherscanVerificationClient implements VerificationClient {
  private readonly breaker = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 10_000 });
  constructor(private readonly baseUrl: string, private readonly apiKey?: string, private readonly chainId?: number, private readonly fetcher: typeof fetch = fetch) { if (!/^https?:\/\//i.test(baseUrl)) throw new Error("Verification API URL must use http or https"); }
  async getContract(address: string): Promise<VerificationResult> {
    assertEvmAddress(address, "verification address");
    if (!this.apiKey) return { status: "unavailable", detail: "not_configured" };
    try {
      const result = await withResilience(this.breaker, async (signal) => {
        const params = new URLSearchParams({ module: "contract", action: "getabi", address, apikey: this.apiKey as string });
        if (this.chainId !== undefined) params.set("chainid", String(this.chainId));
        const response = await this.fetcher(`${this.baseUrl}?${params.toString()}`, { headers: { accept: "application/json" }, signal });
        if (response.status === 429) throw new ExternalCallError({ kind: "rate_limited", message: "Verification provider rate limited the request", retryable: true });
        if (!response.ok) throw new ExternalCallError({ kind: "provider_failure", message: `Verification provider returned HTTP ${response.status}`, retryable: response.status >= 500 });
        let body: unknown;
        try { body = await response.json(); } catch { throw new ExternalCallError({ kind: "malformed_response", message: "Verification provider returned invalid JSON", retryable: false }); }
        if (typeof body !== "object" || body === null) throw new ExternalCallError({ kind: "malformed_response", message: "Verification provider returned a non-object response", retryable: false });
        return body as EtherscanResponse;
      }, { timeoutMs: 5_000, retry: { maxAttempts: 2, baseDelayMs: 100, maxDelayMs: 500 } }, (error) => error instanceof ExternalCallError ? error.failure : { kind: "provider_failure", message: error instanceof Error ? error.message : "Verification provider request failed", retryable: true });
      if (result.status === "1") return { status: "verified", abi: parseAbi(result.result) };
      if (isUnverified(result.message, result.result)) return { status: "unverified", detail: resultDetail(result, "Contract source code is not verified") };
      return { status: "unavailable", detail: resultDetail(result, "verification provider returned an unsuccessful response") };
    } catch (error) {
      if (error instanceof ExternalCallError) return { status: "unavailable", detail: error.failure.kind };
      return { status: "unavailable", detail: "external_api_failure" };
    }
  }
}
export function findExactFunction(abi: readonly VerifiedFunction[], name: string, inputTypes: readonly string[]): VerifiedFunction | undefined { return abi.find((item) => item.name === name && item.inputs.length === inputTypes.length && item.inputs.every((input, index) => input.type === inputTypes[index])); }
