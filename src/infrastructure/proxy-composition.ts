import { assertEvmAddress } from "../domain/address.js";
import { resolveProxy, type ProxyResolution, type ProxyResolutionStatus } from "./proxy.js";
import type { JsonRpcClient } from "./rpc.js";

export interface ProxyCompositionLayer {
  address: string;
  depth: number;
  resolution: ProxyResolution;
}

export type ProxyCompositionStatus =
  | "direct"
  | "composed"
  | "cycle_detected"
  | "max_depth"
  | "unavailable"
  | "error";

export interface ProxyComposition {
  rootAddress: string;
  effectiveCodeAddress?: string;
  status: ProxyCompositionStatus;
  maxDepth: number;
  layers: readonly ProxyCompositionLayer[];
  observedImplementationLineage: readonly string[];
  terminalStatus: ProxyResolutionStatus;
  cycleAddress?: string;
}

export interface ProxyCompositionOptions {
  maxDepth?: number;
}

const DEFAULT_MAX_DEPTH = 4;

export async function resolveProxyComposition(
  rpc: JsonRpcClient,
  contractAddress: string,
  options: ProxyCompositionOptions = {},
): Promise<ProxyComposition> {
  assertEvmAddress(contractAddress, "contract address");
  const maxDepth = Math.max(0, Math.min(options.maxDepth ?? DEFAULT_MAX_DEPTH, 8));
  const visited = new Set<string>();
  const layers: ProxyCompositionLayer[] = [];
  const lineage: string[] = [];

  let currentAddress = contractAddress;
  let terminalStatus: ProxyResolutionStatus = "direct";

  for (let depth = 0; depth <= maxDepth; depth += 1) {
    const normalizedAddress = currentAddress.toLowerCase();
    if (visited.has(normalizedAddress)) {
      return {
        rootAddress: contractAddress,
        status: "cycle_detected",
        maxDepth,
        layers,
        observedImplementationLineage: lineage,
        terminalStatus,
        cycleAddress: currentAddress,
        ...(lineage.length > 0 ? { effectiveCodeAddress: lineage[lineage.length - 1] } : {}),
      };
    }

    visited.add(normalizedAddress);
    const resolution = await resolveProxy(rpc, currentAddress);
    layers.push({ address: currentAddress, depth, resolution });
    terminalStatus = resolution.status;

    if (resolution.status === "unavailable" || resolution.status === "error" || resolution.status === "beacon_unresolved") {
      return {
        rootAddress: contractAddress,
        status: resolution.status,
        maxDepth,
        layers,
        observedImplementationLineage: lineage,
        terminalStatus,
        ...(lineage.length > 0 ? { effectiveCodeAddress: lineage[lineage.length - 1] } : {}),
      };
    }

    if (resolution.codeAddress === undefined || resolution.codeAddress.toLowerCase() === currentAddress.toLowerCase()) {
      return {
        rootAddress: contractAddress,
        status: lineage.length === 0 ? "direct" : "composed",
        maxDepth,
        layers,
        observedImplementationLineage: lineage,
        terminalStatus,
        ...(lineage.length > 0 ? { effectiveCodeAddress: lineage[lineage.length - 1] } : {}),
      };
    }

    lineage.push(resolution.codeAddress);
    if (depth === maxDepth) {
      return {
        rootAddress: contractAddress,
        status: "max_depth",
        maxDepth,
        layers,
        observedImplementationLineage: lineage,
        terminalStatus,
        effectiveCodeAddress: resolution.codeAddress,
      };
    }

    currentAddress = resolution.codeAddress;
  }

  return {
    rootAddress: contractAddress,
    status: "max_depth",
    maxDepth,
    layers,
    observedImplementationLineage: lineage,
    terminalStatus,
    ...(lineage.length > 0 ? { effectiveCodeAddress: lineage[lineage.length - 1] } : {}),
  };
}
