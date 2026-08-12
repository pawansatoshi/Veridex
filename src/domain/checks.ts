import { assertEvmAddress } from "../domain/address.js";
import { findPush4Selectors } from "../domain/bytecode.js";
import { nowIso, type EvidenceFailureKind, type EvidenceProvenance } from "../domain/evidence.js";
import { RpcApplicationRevert, type RpcTransport } from "../infra/json-rpc.js";
import { findExactFunction, type VerificationClient, type VerifiedFunction } from "../infra/verification.js";
import type { CheckResult } from "../types/analysis.js";

const OWNER_SELECTOR = "0x8da5cb5b";
const PAUSED_SELECTOR = "0x5c975abb";
const DEFAULT_MINT_SELECTORS = ["0x40c10f19", "0xa0712d68"] as const;

export interface AnalysisContext {
  requestedAddress: string;
  contractAddress: string;
  codeAddress?: string;
  chain: string;
  rpc: RpcTransport;
  verification?: VerificationClient;
}

function provenance(input: {
  tier: EvidenceProvenance["tier"];
  method: string;
  queriedAddress?: string;
  codeAddress?: string;
  source?: string;
  failure?: EvidenceFailureKind;
  detail?: string;
}): EvidenceProvenance {
  const result: EvidenceProvenance = { tier: input.tier, method: input.method, observedAt: nowIso() };
  if (input.queriedAddress !== undefined) result.queriedAddress = input.queriedAddress;
  if (input.codeAddress !== undefined) result.codeAddress = input.codeAddress;
  if (input.source !== undefined) result.source = input.source;
  if (input.failure !== undefined) result.failure = input.failure;
  if (input.detail !== undefined) result.detail = input.detail;
  return result;
}

function baseResult<E>(checkName: string, evidence: E, status: CheckResult["status"], passed: boolean, p: EvidenceProvenance): CheckResult<E> {
  const result: CheckResult<E> = { checkName, evidence, status, passed, confidence: 1, certaintyStatus: status === "positive" || status === "negative" ? "conclusive" : "inconclusive", provenance: p, detectionMethod: p.tier };
  return result;
}

async function loadVerification(context: AnalysisContext): Promise<{ abi?: readonly VerifiedFunction[]; reason?: "not_configured" | "unverified_contract" | "api_failure"; detail?: string }> {
  if (!context.verification) return { reason: "not_configured" };
  const result = await context.verification.getContract(context.codeAddress ?? context.contractAddress);
  if (result.status === "verified") return { abi: result.abi };
  if (result.status === "unverified") return { reason: "unverified_contract", detail: result.detail };
  return { reason: "api_failure", detail: result.detail };
}

function decodeWordAddress(data: string): string {
  if (!/^0x[0-9a-fA-F]{64,}$/.test(data)) throw new Error("RPC address return is malformed");
  const address = `0x${data.slice(-40)}`;
  assertEvmAddress(address, "RPC returned address");
  return address;
}

function decodeBool(data: string): boolean {
  if (!/^0x[0-9a-fA-F]{64}$/.test(data)) throw new Error("RPC boolean return is malformed");
  const value = BigInt(`0x${data.slice(2)}`);
  if (value !== 0n && value !== 1n) throw new Error("RPC boolean return is not canonical");
  return value === 1n;
}

async function capabilityEvidence(context: AnalysisContext, checkName: string, abiName: string, abiTypes: readonly string[], fallbackSelectors: readonly string[]): Promise<CheckResult> {
  const codeAddress = context.codeAddress ?? context.contractAddress;
  const verification = await loadVerification(context);
  if (verification.abi !== undefined) {
    const match = findExactFunction(verification.abi, abiName, abiTypes);
    const p = provenance({ tier: "verified_abi", method: "exact_function_signature", queriedAddress: context.contractAddress, codeAddress, source: "verification_provider" });
    return baseResult(checkName, { detected: match !== undefined, signature: `${abiName}(${abiTypes.join(",")})`, scannedAddress: codeAddress }, match ? "positive" : "negative", match === undefined, p);
  }

  const bytecode = await context.rpc.getCode(codeAddress);
  const selectors = findPush4Selectors(bytecode, fallbackSelectors);
  const selector = selectors[0];
  const pInput: { tier: EvidenceProvenance["tier"]; method: string; codeAddress: string; failure?: EvidenceFailureKind; detail?: string } = { tier: "bytecode_fallback", method: "instruction_aligned_push4", codeAddress };
  if (verification.reason !== undefined) pInput.failure = verification.reason === "api_failure" ? "external_api_failure" : verification.reason;
  if (verification.detail !== undefined) pInput.detail = verification.detail;
  const p = provenance(pInput);
  return baseResult(checkName, { detected: selector !== undefined, selector, scannedAddress: codeAddress }, selector ? "positive" : "negative", selector === undefined, p);
}

export async function checkOwnership(context: AnalysisContext): Promise<CheckResult> {
  const codeAddress = context.codeAddress ?? context.contractAddress;
  const verification = await loadVerification(context);
  const exact = verification.abi ? findExactFunction(verification.abi, "owner", []) : undefined;
  const bytecode = exact ? undefined : await context.rpc.getCode(codeAddress);
  const detected = exact !== undefined || (bytecode !== undefined && findPush4Selectors(bytecode, [OWNER_SELECTOR]).length > 0);

  if (!detected) {
    const pInput: { tier: EvidenceProvenance["tier"]; method: string; codeAddress: string; failure?: EvidenceFailureKind; detail?: string } = { tier: "bytecode_fallback", method: "instruction_aligned_push4", codeAddress };
    if (verification.reason !== undefined) pInput.failure = verification.reason === "api_failure" ? "external_api_failure" : verification.reason;
    if (verification.detail !== undefined) pInput.detail = verification.detail;
    return baseResult("ownership", { ownable: false }, "inapplicable", true, provenance(pInput));
  }

  try {
    const owner = decodeWordAddress(await context.rpc.call(context.contractAddress, OWNER_SELECTOR));
    const renounced = /^0x0{40}$/i.test(owner);
    const p = provenance({ tier: exact ? "verified_abi" : "bytecode_fallback", method: exact ? "verified_owner_call" : "owner_selector_plus_live_call", queriedAddress: context.contractAddress, codeAddress });
    return baseResult("ownership", { ownable: true, owner, renounced }, "negative", true, p);
  } catch (error) {
    const failure: EvidenceFailureKind = error instanceof RpcApplicationRevert ? "rpc_revert" : "provider_failure";
    const p = provenance({ tier: exact ? "verified_abi" : "bytecode_fallback", method: "owner_call", queriedAddress: context.contractAddress, codeAddress, failure, detail: error instanceof Error ? error.message : "unknown RPC failure" });
    return { ...baseResult("ownership", { ownable: true }, "unavailable", false, p), error: error instanceof Error ? error.message : "unknown RPC failure", failure };
  }
}

export async function checkPauseCapability(context: AnalysisContext): Promise<CheckResult> {
  return capabilityEvidence(context, "pause_capability", "paused", [], [PAUSED_SELECTOR]);
}

export async function checkPausedState(context: AnalysisContext, capability: CheckResult): Promise<CheckResult> {
  if (capability.status !== "positive") return { checkName: "paused_state", passed: true, status: "inapplicable", confidence: 1, certaintyStatus: "inconclusive", evidence: { reason: "pause capability not established" }, provenance: capability.provenance };
  try {
    const paused = decodeBool(await context.rpc.call(context.contractAddress, PAUSED_SELECTOR));
    const p = provenance({ tier: capability.provenance?.tier ?? "direct_onchain", method: "live_paused_call", queriedAddress: context.contractAddress, codeAddress: context.codeAddress ?? context.contractAddress });
    return baseResult("paused_state", { paused }, paused ? "positive" : "negative", !paused, p);
  } catch (error) {
    const failure: EvidenceFailureKind = error instanceof RpcApplicationRevert ? "rpc_revert" : "provider_failure";
    const p = provenance({ tier: capability.provenance?.tier ?? "direct_onchain", method: "live_paused_call", queriedAddress: context.contractAddress, codeAddress: context.codeAddress ?? context.contractAddress, failure, detail: error instanceof Error ? error.message : "unknown RPC failure" });
    return { ...baseResult("paused_state", {}, "unavailable", false, p), failure, error: error instanceof Error ? error.message : "unknown RPC failure" };
  }
}

export async function checkMintCapability(context: AnalysisContext): Promise<CheckResult> {
  const result = await capabilityEvidence(context, "mint_capability", "mint", ["address", "uint256"], DEFAULT_MINT_SELECTORS);
  if (result.status === "positive") return { ...result, evidence: { ...result.evidence, authority: "unknown", authorityConclusion: "capability presence does not establish who may call mint" } };
  return result;
}
