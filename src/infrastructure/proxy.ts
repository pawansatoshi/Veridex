import { assertEvmAddress } from "../domain/address.js";
import type { JsonRpcClient, RpcResult } from "./rpc.js";

export const EIP1967_IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
export const EIP1967_BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
export const EIP1967_ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
export const IBEACON_IMPLEMENTATION_SELECTOR = "0x5c60da1b";

export type ProxyResolutionStatus =
  | "direct"
  | "implementation_resolved"
  | "beacon_resolved"
  | "beacon_unresolved"
  | "unavailable"
  | "error";

export interface ProxyResolution {
  contractAddress: string;
  codeAddress?: string;
  status: ProxyResolutionStatus;
  evidence: {
    implementationSlot: string;
    beaconSlot: string;
    adminSlot: string;
    implementationAddress?: string;
    beaconAddress?: string;
    adminAddress?: string;
    detail?: string;
  };
}

function decodeStorageAddress(data: string): string | undefined {
  if (!/^0x[0-9a-fA-F]*$/.test(data) || data.length !== 66) {
    throw new Error("Malformed EIP-1967 storage response: expected 32 bytes");
  }
  const address = `0x${data.slice(-40)}`;
  assertEvmAddress(address, "proxy storage address");
  return address.toLowerCase() === "0x0000000000000000000000000000000000000000" ? undefined : address;
}

async function readSlot(rpc: JsonRpcClient, contractAddress: string, slot: string): Promise<RpcResult<string>> {
  return rpc.call<string>("eth_getStorageAt", [contractAddress, slot, "latest"]);
}

export async function resolveProxy(rpc: JsonRpcClient, contractAddress: string): Promise<ProxyResolution> {
  assertEvmAddress(contractAddress, "contract address");

  const implementation = await readSlot(rpc, contractAddress, EIP1967_IMPLEMENTATION_SLOT);
  const beacon = await readSlot(rpc, contractAddress, EIP1967_BEACON_SLOT);
  const admin = await readSlot(rpc, contractAddress, EIP1967_ADMIN_SLOT);

  if (implementation.kind === "failure" || beacon.kind === "failure" || admin.kind === "failure") {
    const failure = [implementation, beacon, admin].find((item) => item.kind === "failure");
    return {
      contractAddress,
      status: "unavailable",
      evidence: {
        implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
        beaconSlot: EIP1967_BEACON_SLOT,
        adminSlot: EIP1967_ADMIN_SLOT,
        detail: failure?.kind === "failure" ? failure.failure.message : "proxy storage query failed",
      },
    };
  }

  try {
    const implementationAddress = decodeStorageAddress(implementation.value);
    const beaconAddress = decodeStorageAddress(beacon.value);
    const adminAddress = decodeStorageAddress(admin.value);

    if (implementationAddress !== undefined) {
      return {
        contractAddress,
        codeAddress: implementationAddress,
        status: "implementation_resolved",
        evidence: {
          implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
          beaconSlot: EIP1967_BEACON_SLOT,
          adminSlot: EIP1967_ADMIN_SLOT,
          implementationAddress,
          ...(adminAddress !== undefined ? { adminAddress } : {}),
        },
      };
    }

    if (beaconAddress === undefined) {
      return {
        contractAddress,
        status: "direct",
        evidence: {
          implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
          beaconSlot: EIP1967_BEACON_SLOT,
          adminSlot: EIP1967_ADMIN_SLOT,
          ...(adminAddress !== undefined ? { adminAddress } : {}),
        },
      };
    }

    const beaconResult = await rpc.call<string>("eth_call", [{ to: beaconAddress, data: IBEACON_IMPLEMENTATION_SELECTOR }, "latest"]);
    if (beaconResult.kind === "failure") {
      return {
        contractAddress,
        status: "beacon_unresolved",
        evidence: {
          implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
          beaconSlot: EIP1967_BEACON_SLOT,
          adminSlot: EIP1967_ADMIN_SLOT,
          beaconAddress,
          ...(adminAddress !== undefined ? { adminAddress } : {}),
          detail: beaconResult.failure.message,
        },
      };
    }

    const resolvedImplementation = decodeStorageAddress(beaconResult.value);
    if (resolvedImplementation === undefined) {
      return {
        contractAddress,
        status: "beacon_unresolved",
        evidence: {
          implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
          beaconSlot: EIP1967_BEACON_SLOT,
          adminSlot: EIP1967_ADMIN_SLOT,
          beaconAddress,
          detail: "Beacon implementation() returned the zero address",
        },
      };
    }

    return {
      contractAddress,
      codeAddress: resolvedImplementation,
      status: "beacon_resolved",
      evidence: {
        implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
        beaconSlot: EIP1967_BEACON_SLOT,
        adminSlot: EIP1967_ADMIN_SLOT,
        beaconAddress,
        implementationAddress: resolvedImplementation,
        ...(adminAddress !== undefined ? { adminAddress } : {}),
      },
    };
  } catch (error) {
    return {
      contractAddress,
      status: "error",
      evidence: {
        implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
        beaconSlot: EIP1967_BEACON_SLOT,
        adminSlot: EIP1967_ADMIN_SLOT,
        detail: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
