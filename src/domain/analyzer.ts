import { assertEvmAddress } from "./address.js";
import { analyzeMintCapability, analyzePauseCapability, observePausedState, type CapabilityObservation } from "./capabilities.js";
import { observeOwner, type OwnershipObservation } from "./ownership.js";
import type { ContractTarget } from "../types/analysis.js";
import type { JsonRpcClient } from "../infrastructure/rpc.js";
import type { ProxyResolution } from "../infrastructure/proxy.js";
import { resolveProxy } from "../infrastructure/proxy.js";
import type { VerificationClient, VerificationEvidence } from "../infrastructure/verification.js";

export interface NormalizedCapability {
  capability: "ownership" | "upgradeability" | "pause" | "mint";
  result: "positive" | "negative" | "inconclusive" | "unavailable" | "error";
  evidence: Record<string, unknown>;
  detectionMethod: "verified_abi" | "verified_source" | "bytecode_fallback" | "direct_onchain";
  confidence: number;
  conclusive: boolean;
  fallbackReason?: string;
}

export interface NormalizedAnalysis {
  contract: {
    requestedAddress: string;
    contractAddress: string;
    codeAddress?: string;
    chain: string;
  };
  proxy: ProxyResolution;
  verification: VerificationEvidence;
  capabilities: readonly NormalizedCapability[];
  evidence: readonly Record<string, unknown>[];
  confidence: number;
  conclusive: boolean;
  providerStatus: {
    verification: VerificationEvidence["status"];
    rpc: "ok" | "unavailable" | "error";
  };
}

export interface AnalysisDependencies {
  rpc: JsonRpcClient;
  verification: VerificationClient;
}

function confidenceFor(result: NormalizedCapability["result"], conclusive: boolean): number {
  if (!conclusive) return result === "inconclusive" ? 0.5 : 0;
  return result === "positive" || result === "negative" ? 1 : 0;
}

function capabilityFromObservation(observation: CapabilityObservation): NormalizedCapability {
  const result = observation.status === "positive"
    ? "positive"
    : observation.status === "negative"
      ? "negative"
      : observation.status === "error"
        ? "error"
        : observation.status === "unavailable"
          ? "unavailable"
          : "inconclusive";

  return {
    capability: observation.capability,
    result,
    evidence: {
      contractAddress: observation.contractAddress,
      ...(observation.codeAddress !== undefined ? { codeAddress: observation.codeAddress } : {}),
      ...observation.evidence,
      ...(observation.authority !== undefined ? { authority: observation.authority } : {}),
    },
    detectionMethod: observation.detectionMethod,
    confidence: confidenceFor(result, observation.conclusive),
    conclusive: observation.conclusive,
    ...(observation.fallbackReason !== undefined ? { fallbackReason: observation.fallbackReason } : {}),
  };
}

function ownershipFinding(observation: OwnershipObservation): NormalizedCapability {
  const result = observation.status === "owner_found" || observation.status === "renounced"
    ? "positive"
    : observation.status === "not_applicable"
      ? "negative"
      : observation.status === "unavailable"
        ? "unavailable"
        : "error";

  return {
    capability: "ownership",
    result,
    evidence: {
      contractAddress: observation.contractAddress,
      queriedAddress: observation.evidence.queriedAddress,
      callData: observation.evidence.callData,
      ...(observation.ownerAddress !== undefined ? { ownerAddress: observation.ownerAddress } : {}),
      ...(observation.evidence.detail !== undefined ? { detail: observation.evidence.detail } : {}),
    },
    detectionMethod: "direct_onchain",
    confidence: confidenceFor(result, result === "positive" || result === "negative"),
    conclusive: result === "positive" || result === "negative",
  };
}

function proxyFinding(proxy: ProxyResolution): NormalizedCapability {
  const result = proxy.status === "direct"
    ? "negative"
    : proxy.status === "implementation_resolved" || proxy.status === "beacon_resolved"
      ? "positive"
      : "inconclusive";

  return {
    capability: "upgradeability",
    result,
    evidence: {
      contractAddress: proxy.contractAddress,
      status: proxy.status,
      ...proxy.evidence,
    },
    detectionMethod: "direct_onchain",
    confidence: confidenceFor(result, result === "positive" || result === "negative"),
    conclusive: result === "positive" || result === "negative",
    ...(result === "inconclusive" ? { fallbackReason: "proxy resolution unavailable or unsupported" } : {}),
  };
}

export async function analyzeContract(
  dependencies: AnalysisDependencies,
  target: ContractTarget & { chain: string },
): Promise<NormalizedAnalysis> {
  assertEvmAddress(target.contractAddress, "contract address");
  if (target.codeAddress !== undefined) assertEvmAddress(target.codeAddress, "code address");
  if (!target.chain.trim()) throw new Error("Chain is required");

  const contractAddress = target.contractAddress;
  const proxy = await resolveProxy(dependencies.rpc, contractAddress);
  const codeAddress = target.codeAddress ?? proxy.codeAddress ?? contractAddress;

  const [verification, bytecodeResult, ownership] = await Promise.all([
    dependencies.verification.lookup(codeAddress),
    dependencies.rpc.call<string>("eth_getCode", [codeAddress, "latest"]),
    observeOwner(dependencies.rpc, contractAddress),
  ]);

  const bytecode = bytecodeResult.kind === "success" ? bytecodeResult.value : undefined;
  const abi = verification.abiAvailable ? verification.abi : undefined;

  const [pauseObservation, mintObservation, pausedState] = await Promise.all([
    Promise.resolve(analyzePauseCapability({ contractAddress, codeAddress, verifiedAbi: abi, bytecode })),
    Promise.resolve(analyzeMintCapability({ contractAddress, codeAddress, verifiedAbi: abi, bytecode })),
    observePausedState(dependencies.rpc, contractAddress),
  ]);

  const capabilities: NormalizedCapability[] = [
    ownershipFinding(ownership),
    proxyFinding(proxy),
    capabilityFromObservation(pauseObservation),
    capabilityFromObservation(mintObservation),
  ];

  const pause = capabilities.find((item) => item.capability === "pause");
  if (pause && pauseObservation.status === "positive") {
    pause.evidence = pausedState.status === "observed"
      ? { ...pause.evidence, paused: pausedState.paused, stateQueriedAddress: pausedState.evidence.queriedAddress }
      : { ...pause.evidence, pausedStateStatus: pausedState.status, pausedStateDetail: pausedState.evidence.detail };
  }

  const rpcStatus = bytecodeResult.kind === "failure" || proxy.status === "unavailable" || ownership.status === "unavailable" || pausedState.status === "unavailable"
    ? "unavailable"
    : "ok";
  const conclusive = capabilities.every((capability) => capability.conclusive)
    && verification.status === "verified"
    && bytecodeResult.kind === "success";
  const confidence = capabilities.length === 0
    ? 0
    : capabilities.reduce((sum, capability) => sum + capability.confidence, 0) / capabilities.length;

  const evidence = capabilities.map((capability) => ({ capability: capability.capability, ...capability.evidence }));

  return {
    contract: {
      requestedAddress: contractAddress,
      contractAddress,
      ...(codeAddress !== contractAddress ? { codeAddress } : {}),
      chain: target.chain,
    },
    proxy,
    verification,
    capabilities,
    evidence,
    confidence,
    conclusive,
    providerStatus: {
      verification: verification.status,
      rpc: rpcStatus,
    },
  };
}
