import { assertEvmAddress } from "./address.js";
import { findPush4Constants } from "./bytecode.js";
import type { JsonRpcClient, RpcResult } from "../infrastructure/rpc.js";

export const PAUSE_SELECTOR = "0x8456cb59";
export const UNPAUSE_SELECTOR = "0x3f4ba83a";
export const PAUSED_SELECTOR = "0x5c975abb";
export const MINT_ADDRESS_AMOUNT_SELECTOR = "0x40c10f19";
export const MINT_ADDRESS_SELECTOR = "0x6a627842";
export const SAFE_MINT_ADDRESS_SELECTOR = "0x40d097c3";

export type CapabilityStatus = "positive" | "negative" | "inconclusive" | "unavailable" | "error";
export type AuthorityStatus = "unknown" | "owner_controlled" | "role_controlled" | "unresolved";

export interface CapabilityObservation {
  contractAddress: string;
  codeAddress?: string;
  capability: "pause" | "mint";
  status: CapabilityStatus;
  conclusive: boolean;
  detectionMethod: "verified_abi" | "verified_source" | "bytecode_fallback" | "direct_onchain";
  evidence: {
    functionNames?: readonly string[];
    selectors?: readonly string[];
    queriedAddress?: string;
    state?: boolean;
    detail?: string;
  };
  fallbackReason?: string;
  authority?: AuthorityStatus;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateAbiEntry(entry: unknown): asserts entry is Record<string, unknown> {
  if (!isRecord(entry) || typeof entry.type !== "string") {
    throw new Error("Malformed ABI: every entry must be an object with a string type");
  }

  if (entry.type !== "function") return;

  if (typeof entry.name !== "string" || entry.name.length === 0) {
    throw new Error("Malformed ABI: function entry requires a name");
  }

  if (!Array.isArray(entry.inputs)) {
    throw new Error("Malformed ABI: function inputs must be an array");
  }

  for (const input of entry.inputs) {
    if (!isRecord(input) || typeof input.type !== "string" || input.type.length === 0) {
      throw new Error("Malformed ABI: function input requires a type");
    }
  }

  if (entry.stateMutability !== undefined && !["pure", "view", "nonpayable", "payable"].includes(String(entry.stateMutability))) {
    throw new Error("Malformed ABI: unsupported function stateMutability");
  }
}

export function hasVerifiedFunction(
  abi: readonly unknown[],
  names: readonly string[],
  options: { requireCallable?: boolean; inputTypes?: readonly string[] } = {},
): boolean {
  if (!Array.isArray(abi)) throw new Error("Malformed ABI: expected an array");

  for (const entry of abi) {
    validateAbiEntry(entry);
    if (entry.type !== "function") continue;
    if (typeof entry.name !== "string" || !names.includes(entry.name)) continue;

    const inputTypes = Array.isArray(entry.inputs) ? entry.inputs.map((input) => (input as Record<string, unknown>).type) : [];
    if (options.inputTypes !== undefined && (inputTypes.length !== options.inputTypes.length || inputTypes.some((type, index) => type !== options.inputTypes?.[index]))) {
      continue;
    }
    if (options.requireCallable && (entry.stateMutability === "view" || entry.stateMutability === "pure")) {
      continue;
    }
    return true;
  }

  return false;
}

function decodeBooleanResult(data: string): boolean {
  if (!/^0x[0-9a-fA-F]*$/.test(data) || data.length !== 66) {
    throw new Error("Malformed boolean return data: expected one ABI-encoded word");
  }
  const word = data.slice(2);
  if (!/^0+$/.test(word.slice(0, 63)) || !/[01]$/.test(word)) {
    throw new Error("Malformed boolean return data: non-canonical value");
  }
  const lastByte = Number.parseInt(word.slice(-2), 16);
  if (lastByte !== 0 && lastByte !== 1) {
    throw new Error("Malformed boolean return data: expected 0 or 1");
  }
  return lastByte === 1;
}

export async function observePausedState(
  rpc: JsonRpcClient,
  contractAddress: string,
): Promise<{
  status: "observed" | "unavailable" | "not_applicable" | "error";
  paused?: boolean;
  evidence: { queriedAddress: string; callData: string; detail?: string };
}> {
  assertEvmAddress(contractAddress, "contract address");
  const result: RpcResult<string> = await rpc.call<string>("eth_call", [
    { to: contractAddress, data: PAUSED_SELECTOR },
    "latest",
  ]);

  if (result.kind === "failure") {
    if (result.failure.class === "application_revert") {
      return {
        status: "not_applicable",
        evidence: { queriedAddress: contractAddress, callData: PAUSED_SELECTOR, detail: "paused() reverted" },
      };
    }
    return {
      status: "unavailable",
      evidence: { queriedAddress: contractAddress, callData: PAUSED_SELECTOR, detail: result.failure.message },
    };
  }

  try {
    return {
      status: "observed",
      paused: decodeBooleanResult(result.value),
      evidence: { queriedAddress: contractAddress, callData: PAUSED_SELECTOR },
    };
  } catch (error) {
    return {
      status: "error",
      evidence: {
        queriedAddress: contractAddress,
        callData: PAUSED_SELECTOR,
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export function analyzePauseCapability(input: {
  contractAddress: string;
  codeAddress?: string;
  verifiedAbi?: readonly unknown[];
  bytecode?: string;
}): CapabilityObservation {
  assertEvmAddress(input.contractAddress, "contract address");
  if (input.codeAddress !== undefined) assertEvmAddress(input.codeAddress, "code address");

  if (input.verifiedAbi !== undefined) {
    const detected = hasVerifiedFunction(input.verifiedAbi, ["pause", "unpause"], { requireCallable: true, inputTypes: [] });
    return {
      contractAddress: input.contractAddress,
      ...(input.codeAddress !== undefined ? { codeAddress: input.codeAddress } : {}),
      capability: "pause",
      status: detected ? "positive" : "negative",
      conclusive: true,
      detectionMethod: "verified_abi",
      evidence: {
        functionNames: detected ? ["pause", "unpause"] : [],
        detail: detected
          ? "Verified ABI exposes an exact callable pause control signature"
          : "Verified ABI does not expose an exact callable pause control signature",
      },
    };
  }

  if (input.bytecode !== undefined) {
    const candidates = findPush4Constants(input.bytecode).filter(({ selector }) =>
      [PAUSE_SELECTOR, UNPAUSE_SELECTOR, PAUSED_SELECTOR].includes(selector),
    );
    return {
      contractAddress: input.contractAddress,
      ...(input.codeAddress !== undefined ? { codeAddress: input.codeAddress } : {}),
      capability: "pause",
      status: "inconclusive",
      conclusive: false,
      detectionMethod: "bytecode_fallback",
      evidence: {
        selectors: candidates.map(({ selector }) => selector),
        detail:
          candidates.length > 0
            ? "A known pause-related selector was found at an instruction boundary; selector collisions prevent a conclusive capability claim"
            : "No known pause selector was found; absence is not conclusive without stronger evidence",
      },
      fallbackReason: "verified ABI/source evidence unavailable",
    };
  }

  return {
    contractAddress: input.contractAddress,
    ...(input.codeAddress !== undefined ? { codeAddress: input.codeAddress } : {}),
    capability: "pause",
    status: "unavailable",
    conclusive: false,
    detectionMethod: "direct_onchain",
    evidence: { detail: "No verified ABI/source or bytecode evidence available" },
    fallbackReason: "insufficient evidence",
  };
}

export function analyzeMintCapability(input: {
  contractAddress: string;
  codeAddress?: string;
  verifiedAbi?: readonly unknown[];
  bytecode?: string;
}): CapabilityObservation {
  assertEvmAddress(input.contractAddress, "contract address");
  if (input.codeAddress !== undefined) assertEvmAddress(input.codeAddress, "code address");

  if (input.verifiedAbi !== undefined) {
    const detected =
      hasVerifiedFunction(input.verifiedAbi, ["mint"], { requireCallable: true, inputTypes: ["address", "uint256"] })
      || hasVerifiedFunction(input.verifiedAbi, ["mint"], { requireCallable: true, inputTypes: ["address"] })
      || hasVerifiedFunction(input.verifiedAbi, ["safeMint"], { requireCallable: true, inputTypes: ["address", "uint256"] });

    return {
      contractAddress: input.contractAddress,
      ...(input.codeAddress !== undefined ? { codeAddress: input.codeAddress } : {}),
      capability: "mint",
      status: detected ? "positive" : "negative",
      conclusive: true,
      detectionMethod: "verified_abi",
      evidence: {
        functionNames: detected ? ["mint", "safeMint"] : [],
        detail: detected
          ? "Verified ABI exposes an exact supported callable mint signature; authorization is not proven by ABI presence alone"
          : "Verified ABI does not expose an exact supported callable mint signature",
      },
      authority: detected ? "unknown" : "unresolved",
    };
  }

  if (input.bytecode !== undefined) {
    const candidates = findPush4Constants(input.bytecode).filter(({ selector }) =>
      [MINT_ADDRESS_AMOUNT_SELECTOR, MINT_ADDRESS_SELECTOR, SAFE_MINT_ADDRESS_SELECTOR].includes(selector),
    );
    return {
      contractAddress: input.contractAddress,
      ...(input.codeAddress !== undefined ? { codeAddress: input.codeAddress } : {}),
      capability: "mint",
      status: "inconclusive",
      conclusive: false,
      detectionMethod: "bytecode_fallback",
      evidence: {
        selectors: candidates.map(({ selector }) => selector),
        detail:
          candidates.length > 0
            ? "A known mint-related selector was found at an instruction boundary; selector collisions prevent a conclusive capability claim"
            : "No known mint selector was found; absence is not conclusive without stronger evidence",
      },
      fallbackReason: "verified ABI/source evidence unavailable",
      authority: "unresolved",
    };
  }

  return {
    contractAddress: input.contractAddress,
    ...(input.codeAddress !== undefined ? { codeAddress: input.codeAddress } : {}),
    capability: "mint",
    status: "unavailable",
    conclusive: false,
    detectionMethod: "direct_onchain",
    evidence: { detail: "No verified ABI/source or bytecode evidence available" },
    fallbackReason: "insufficient evidence",
    authority: "unresolved",
  };
}
