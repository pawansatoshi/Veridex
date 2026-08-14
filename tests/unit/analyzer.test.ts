import { describe, expect, it, vi } from "vitest";
import { analyzeContract } from "../../src/domain/analyzer.js";
import { VerificationClient } from "../../src/infrastructure/verification.js";
import type { JsonRpcClient } from "../../src/infrastructure/rpc.js";

const CONTRACT = "0x0000000000000000000000000000000000000001";
const OWNER = "0x1111111111111111111111111111111111111111";
const OWNER_RESULT = `0x${"0".repeat(24)}${OWNER.slice(2)}`;
const TRUE_RESULT = `0x${"0".repeat(63)}1`;
const BYTECODE = "0x6001600155";

function fakeRpc(): JsonRpcClient {
  return {
    call: vi.fn(async (method: string, params: readonly unknown[]) => {
      if (method === "eth_getStorageAt") return { kind: "success", value: `0x${"0".repeat(64)}` };
      if (method === "eth_getCode") return { kind: "success", value: BYTECODE };
      if (method === "eth_call") {
        const request = params[0] as { data?: string };
        if (request.data === "0x8da5cb5b") return { kind: "success", value: OWNER_RESULT };
        if (request.data === "0x5c975abb") return { kind: "success", value: TRUE_RESULT };
      }
      throw new Error(`Unexpected RPC call: ${method}`);
    }),
  } as unknown as JsonRpcClient;
}

describe("H1 analysis orchestrator", () => {
  it("normalizes verification, proxy, ownership, pause and mint evidence", async () => {
    const rpc = fakeRpc();
    const verification = new VerificationClient({
      lookup: vi.fn(async () => ({
        status: "verified" as const,
        data: {
          abi: [
            { type: "function", name: "pause", inputs: [], stateMutability: "nonpayable" },
            { type: "function", name: "unpause", inputs: [], stateMutability: "nonpayable" },
            { type: "function", name: "paused", inputs: [], stateMutability: "view" },
            { type: "function", name: "mint", inputs: [{ type: "address" }], stateMutability: "nonpayable" },
          ],
        },
      })),
    });

    const result = await analyzeContract({ rpc, verification }, { contractAddress: CONTRACT, chain: "ethereum" });

    expect(result.contract.contractAddress).toBe(CONTRACT);
    expect(result.contract.codeAddress).toBeUndefined();
    expect(result.proxy.status).toBe("direct");
    expect(result.verification.provenance).toBe("verified_abi");
    expect(result.capabilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ capability: "ownership", result: "positive", conclusive: true }),
      expect.objectContaining({ capability: "upgradeability", result: "negative", conclusive: true }),
      expect.objectContaining({ capability: "pause", result: "positive", conclusive: true }),
      expect.objectContaining({ capability: "mint", result: "positive", conclusive: true }),
    ]));
    expect(result.capabilities.find((item) => item.capability === "pause")?.evidence).toMatchObject({ paused: true });
    expect(result.conclusive).toBe(true);
    expect(result.confidence).toBe(1);
  });

  it("never turns missing verification into conclusive capability absence", async () => {
    const rpc = fakeRpc();
    const verification = new VerificationClient({ lookup: vi.fn(async () => ({ status: "unverified_contract" as const })) });

    const result = await analyzeContract({ rpc, verification }, { contractAddress: CONTRACT, chain: "ethereum" });

    expect(result.verification.status).toBe("unverified_contract");
    expect(result.conclusive).toBe(false);
    expect(result.capabilities.find((item) => item.capability === "pause")).toMatchObject({
      result: "inconclusive",
      conclusive: false,
      detectionMethod: "bytecode_fallback",
    });
  });
});
