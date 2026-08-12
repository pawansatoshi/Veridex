import { assertEvmAddress, isEvmAddress } from "../domain/address.js";
import type { ProxyEvidence } from "../types/analysis.js";
import type { RpcTransport } from "../infra/json-rpc.js";

export const ERC1967_IMPLEMENTATION_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
export const ERC1967_BEACON_SLOT = "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";
export const ERC1967_ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";

function slotAddress(value: string): string | undefined {
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) return undefined;
  const candidate = `0x${value.slice(-40)}`;
  return isEvmAddress(candidate) && !/^0x0{40}$/.test(candidate) ? candidate : undefined;
}

export interface ProxyDetection {
  evidence: ProxyEvidence;
  detail: string;
}

export async function detectErc1967Proxy(rpc: RpcTransport, contractAddress: string): Promise<ProxyDetection> {
  assertEvmAddress(contractAddress, "proxy address");
  const [implementationSlot, beaconSlot] = await Promise.all([
    rpc.getStorageAt(contractAddress, ERC1967_IMPLEMENTATION_SLOT),
    rpc.getStorageAt(contractAddress, ERC1967_BEACON_SLOT),
  ]);

  const implementation = slotAddress(implementationSlot);
  if (implementation !== undefined) {
    return {
      evidence: { isProxy: true, proxyType: "unknown", implementationAddress: implementation },
      detail: "ERC-1967 implementation slot contains a non-zero address; proxy family is not inferred from the slot alone.",
    };
  }

  const beacon = slotAddress(beaconSlot);
  if (beacon !== undefined) {
    return {
      evidence: { isProxy: true, proxyType: "beacon", beaconAddress: beacon },
      detail: "ERC-1967 beacon slot contains a beacon address; implementation remains unresolved until beacon.implementation() is called.",
    };
  }

  return { evidence: { isProxy: false }, detail: "No non-zero ERC-1967 implementation or beacon slot was observed." };
}
