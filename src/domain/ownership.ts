import { assertEvmAddress, isEvmAddress } from "./address.js";
import type { JsonRpcClient, RpcResult } from "../infrastructure/rpc.js";

// Derived from the canonical Solidity signature `owner()` documented by OpenZeppelin Ownable.
export const OWNABLE_OWNER_SELECTOR = "0x8da5cb5b";

export type OwnershipStatus = "owner_found" | "renounced" | "not_applicable" | "unavailable" | "error";

export interface OwnershipObservation {
  contractAddress: string;
  status: OwnershipStatus;
  ownerAddress?: string;
  selector: string;
  detectionMethod: "verified_abi";
  evidence: {
    queriedAddress: string;
    callData: string;
    detail?: string;
  };
}

export function validateFunctionSelector(selector: string): string {
  if (!/^0x[0-9a-fA-F]{8}$/.test(selector)) {
    throw new Error("Invalid function selector: expected 4-byte 0x-prefixed hex");
  }
  return selector;
}

export function decodeAddressResult(data: string): string | undefined {
  if (!/^0x[0-9a-fA-F]*$/.test(data) || data.length % 2 !== 0) {
    throw new Error("Malformed address return data");
  }
  if (data === "0x") return undefined;
  if (data.length !== 66) throw new Error("Malformed address return data: expected one ABI-encoded address");
  const address = `0x${data.slice(-40)}`;
  assertEvmAddress(address, "owner result");
  return address;
}

export async function observeOwner(
  rpc: JsonRpcClient,
  contractAddress: string,
  selector = OWNABLE_OWNER_SELECTOR,
): Promise<OwnershipObservation> {
  assertEvmAddress(contractAddress, "contract address");
  validateFunctionSelector(selector);

  const result: RpcResult<string> = await rpc.call<string>("eth_call", [{ to: contractAddress, data: selector }, "latest"]);
  if (result.kind === "failure") {
    if (result.failure.class === "application_revert") {
      return {
        contractAddress,
        status: "not_applicable",
        selector,
        detectionMethod: "verified_abi",
        evidence: { queriedAddress: contractAddress, callData: selector, detail: "owner() call reverted; no callable owner observation" },
      };
    }
    return {
      contractAddress,
      status: "unavailable",
      selector,
      detectionMethod: "verified_abi",
      evidence: { queriedAddress: contractAddress, callData: selector, detail: result.failure.message },
    };
  }

  try {
    const ownerAddress = decodeAddressResult(result.value);
    if (ownerAddress === undefined) {
      return {
        contractAddress,
        status: "not_applicable",
        selector,
        detectionMethod: "verified_abi",
        evidence: { queriedAddress: contractAddress, callData: selector, detail: "owner() returned empty data" },
      };
    }
    if (ownerAddress.toLowerCase() === "0x0000000000000000000000000000000000000000") {
      return {
        contractAddress,
        status: "renounced",
        ownerAddress,
        selector,
        detectionMethod: "verified_abi",
        evidence: { queriedAddress: contractAddress, callData: selector, detail: "owner is the zero address" },
      };
    }
    return {
      contractAddress,
      status: "owner_found",
      ownerAddress,
      selector,
      detectionMethod: "verified_abi",
      evidence: { queriedAddress: contractAddress, callData: selector },
    };
  } catch (error) {
    return {
      contractAddress,
      status: "error",
      selector,
      detectionMethod: "verified_abi",
      evidence: {
        queriedAddress: contractAddress,
        callData: selector,
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

export function normalizeOwnerAddress(value: string): string {
  assertEvmAddress(value, "owner address");
  if (!isEvmAddress(value)) throw new Error("Invalid owner address");
  return value.toLowerCase();
}
