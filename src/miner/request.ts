import type { MinerRequest } from "./http.js";

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/;

/**
 * H1 semantic analysis is Ethereum mainnet only. Accept the unambiguous
 * labels callers commonly use, but normalize them to chain id "1" so the
 * Miner cannot silently analyze another chain against the Ethereum RPC.
 */
export function normalizeMinerRequest(value: unknown): MinerRequest | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const input = value as Record<string, unknown>;
  if (typeof input.chain !== "string" || input.chain.trim().length === 0 || input.chain.length > 64) return undefined;
  const chain = input.chain.trim().toLowerCase();
  if (chain !== "1" && chain !== "ethereum" && chain !== "ethereum-mainnet") return undefined;
  if (typeof input.contractAddress !== "string" || !ADDRESS_RE.test(input.contractAddress)) return undefined;
  if (input.codeAddress !== undefined && (typeof input.codeAddress !== "string" || !ADDRESS_RE.test(input.codeAddress))) return undefined;

  return {
    chain: "1",
    contractAddress: input.contractAddress,
    ...(input.codeAddress !== undefined ? { codeAddress: input.codeAddress } : {}),
  };
}
