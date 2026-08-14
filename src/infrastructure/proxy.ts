import { assertEvmAddress } from "../domain/address.js";
import type { JsonRpcClient, RpcResult } from "./rpc.js";

export const EIP1967_IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
export const EIP1967_BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
export const EIP1967_ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
export const ZEPPELINOS_IMPLEMENTATION_SLOT = "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c";
export const ZEPPELINOS_ADMIN_SLOT = "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b";
export const IBEACON_IMPLEMENTATION_SELECTOR = "0x5c60da1b";
export const LEGACY_IMPLEMENTATION_SELECTOR = "0x5c60da1b";

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
    legacyImplementationSlot?: string;
    legacyAdminSlot?: string;
    implementationAddress?: string;
    beaconAddress?: string;
    adminAddress?: string;
    implementationSelector?: string;
    detail?: string;
  };
}

function decodeStorageAddress(data: string): string | undefined {
  if (data === "0x" || data === "0x0") return undefined;
  if (!/^0x[0-9a-fA-F]*$/.test(data) || data.length !== 66) {
    throw new Error("Malformed EIP-1967 storage response: expected 32 bytes");
  }
  const address = `0x${data.slice(-40)}`;
  assertEvmAddress(address, "proxy storage address");
  return address.toLowerCase() === "0x0000000000000000000000000000000000000000" ? undefined : address;
}

function decodeCallAddress(data: string): string | undefined {
  return decodeStorageAddress(data);
}

async function readSlot(rpc: JsonRpcClient, contractAddress: string, slot: string): Promise<RpcResult<string>> {
  return rpc.call<string>("eth_getStorageAt", [contractAddress, slot, "latest"]);
}

export async function resolveProxy(rpc: JsonRpcClient, contractAddress: string): Promise<ProxyResolution> {
  assertEvmAddress(contractAddress, "contract address");

  const [implementation, beacon, admin, legacyImplementation, legacyAdmin] = await Promise.all([
    readSlot(rpc, contractAddress, EIP1967_IMPLEMENTATION_SLOT),
    readSlot(rpc, contractAddress, EIP1967_BEACON_SLOT),
    readSlot(rpc, contractAddress, EIP1967_ADMIN_SLOT),
    readSlot(rpc, contractAddress, ZEPPELINOS_IMPLEMENTATION_SLOT),
    readSlot(rpc, contractAddress, ZEPPELINOS_ADMIN_SLOT),
  ]);

  if ([implementation, beacon, admin, legacyImplementation, legacyAdmin].some((item) => item.kind === "failure")) {
    const failure = [implementation, beacon, admin, legacyImplementation, legacyAdmin].find((item) => item.kind === "failure");
    return {
      contractAddress,
      status: "unavailable",
      evidence: {
        implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
        beaconSlot: EIP1967_BEACON_SLOT,
        adminSlot: EIP1967_ADMIN_SLOT,
        legacyImplementationSlot: ZEPPELINOS_IMPLEMENTATION_SLOT,
        legacyAdminSlot: ZEPPELINOS_ADMIN_SLOT,
        detail: failure?.kind === "failure" ? failure.failure.message : "proxy storage query failed",
      },
    };
  }

  try {
    const implementationAddress = decodeStorageAddress(implementation.value);
    const beaconAddress = decodeStorageAddress(beacon.value);
    const adminAddress = decodeStorageAddress(admin.value);
    const legacyImplementationAddress = decodeStorageAddress(legacyImplementation.value);
    const legacyAdminAddress = decodeStorageAddress(legacyAdmin.value);
    const effectiveAdminAddress = adminAddress ?? legacyAdminAddress;

    if (implementationAddress !== undefined) {
      return {
        contractAddress,
        codeAddress: implementationAddress,
        status: "implementation_resolved",
        evidence: {
          implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
          beaconSlot: EIP1967_BEACON_SLOT,
          adminSlot: EIP1967_ADMIN_SLOT,
          ...(effectiveAdminAddress !== undefined ? { adminAddress: effectiveAdminAddress } : {}),
          implementationAddress,
        },
      };
    }

    if (legacyImplementationAddress !== undefined) {
      return {
        contractAddress,
        codeAddress: legacyImplementationAddress,
        status: "implementation_resolved",
        evidence: {
          implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
          beaconSlot: EIP1967_BEACON_SLOT,
          adminSlot: EIP1967_ADMIN_SLOT,
          legacyImplementationSlot: ZEPPELINOS_IMPLEMENTATION_SLOT,
          legacyAdminSlot: ZEPPELINOS_ADMIN_SLOT,
          implementationAddress: legacyImplementationAddress,
          ...(effectiveAdminAddress !== undefined ? { adminAddress: effectiveAdminAddress } : {}),
          detail: "Resolved through the legacy ZeppelinOS implementation storage slot",
        },
      };
    }

    if (beaconAddress !== undefined) {
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
            ...(effectiveAdminAddress !== undefined ? { adminAddress: effectiveAdminAddress } : {}),
            detail: beaconResult.failure.message,
          },
        };
      }

      const resolvedImplementation = decodeCallAddress(beaconResult.value);
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
          ...(effectiveAdminAddress !== undefined ? { adminAddress: effectiveAdminAddress } : {}),
        },
      };
    }

    // Some proxy families expose implementation() only to their admin, so a
    // public eth_call can legitimately revert. This is only a final fallback;
    // the exact on-chain storage slots above are preferred and authoritative.
    const legacyResult = await rpc.call<string>("eth_call", [{ to: contractAddress, data: LEGACY_IMPLEMENTATION_SELECTOR }, "latest"]);
    if (legacyResult.kind === "success") {
      const legacyGetterImplementation = decodeCallAddress(legacyResult.value);
      if (legacyGetterImplementation !== undefined && legacyGetterImplementation.toLowerCase() !== contractAddress.toLowerCase()) {
        return {
          contractAddress,
          codeAddress: legacyGetterImplementation,
          status: "implementation_resolved",
          evidence: {
            implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
            beaconSlot: EIP1967_BEACON_SLOT,
            adminSlot: EIP1967_ADMIN_SLOT,
            implementationAddress: legacyGetterImplementation,
            implementationSelector: LEGACY_IMPLEMENTATION_SELECTOR,
            ...(effectiveAdminAddress !== undefined ? { adminAddress: effectiveAdminAddress } : {}),
            detail: "Resolved through an exact implementation() on-chain getter rather than storage",
          },
        };
      }
    }

    return {
      contractAddress,
      status: "direct",
      evidence: {
        implementationSlot: EIP1967_IMPLEMENTATION_SLOT,
        beaconSlot: EIP1967_BEACON_SLOT,
        adminSlot: EIP1967_ADMIN_SLOT,
        ...(effectiveAdminAddress !== undefined ? { adminAddress: effectiveAdminAddress } : {}),
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
