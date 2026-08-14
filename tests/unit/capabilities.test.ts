import { describe, expect, it, vi } from "vitest";
import {
  analyzeMintCapability,
  analyzePauseCapability,
  hasVerifiedFunction,
  observePausedState,
  PAUSED_SELECTOR,
} from "../../src/domain/capabilities.js";
import type { JsonRpcClient } from "../../src/infrastructure/rpc.js";

const CONTRACT = "0x0000000000000000000000000000000000000001";
const IMPLEMENTATION = "0x0000000000000000000000000000000000000002";

function fakeRpc(result: unknown): JsonRpcClient {
  return { call: vi.fn().mockResolvedValue(result) } as unknown as JsonRpcClient;
}

const ABI_WITH_PAUSE = [
  { type: "function", name: "paused", inputs: [], stateMutability: "view" },
  { type: "function", name: "pause", inputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "unpause", inputs: [], stateMutability: "nonpayable" },
];

const ABI_WITH_MINT = [
  {
    type: "function",
    name: "mint",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
];

describe("pause and mint capabilities", () => {
  it("treats a verified pause ABI as conclusive capability evidence", () => {
    const result = analyzePauseCapability({
      contractAddress: CONTRACT,
      codeAddress: IMPLEMENTATION,
      verifiedAbi: ABI_WITH_PAUSE,
    });

    expect(result).toMatchObject({
      capability: "pause",
      status: "positive",
      conclusive: true,
      detectionMethod: "verified_abi",
      contractAddress: CONTRACT,
      codeAddress: IMPLEMENTATION,
    });
  });

  it("does not confuse paused-state exposure with a pause control surface", () => {
    const result = analyzePauseCapability({
      contractAddress: CONTRACT,
      verifiedAbi: [{ type: "function", name: "paused", inputs: [], stateMutability: "view" }],
    });

    expect(result).toMatchObject({ capability: "pause", status: "negative", conclusive: true });
  });

  it("requires exact input types for verified mint detection", () => {
    const result = analyzeMintCapability({
      contractAddress: CONTRACT,
      verifiedAbi: [{ type: "function", name: "mint", inputs: [{ type: "uint256" }], stateMutability: "nonpayable" }],
    });

    expect(result).toMatchObject({ capability: "mint", status: "negative", conclusive: true });
  });

  it("does not treat a view-only function named mint as mint authority", () => {
    const result = analyzeMintCapability({
      contractAddress: CONTRACT,
      verifiedAbi: [{ type: "function", name: "mint", inputs: [{ type: "address" }, { type: "uint256" }], stateMutability: "view" }],
    });

    expect(result).toMatchObject({ capability: "mint", status: "negative", conclusive: true });
  });

  it("returns live paused state from the contract address", async () => {
    const rpc = fakeRpc({ kind: "success", value: `0x${"0".repeat(63)}1` });
    const result = await observePausedState(rpc, CONTRACT);

    expect(result).toMatchObject({
      status: "observed",
      paused: true,
      evidence: { queriedAddress: CONTRACT, callData: PAUSED_SELECTOR },
    });
  });

  it("does not convert an expected paused() revert into infrastructure failure", async () => {
    const rpc = fakeRpc({ kind: "failure", failure: { class: "application_revert", message: "execution reverted" } });
    const result = await observePausedState(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "not_applicable" });
  });

  it("keeps RPC infrastructure failure separate from pause state", async () => {
    const rpc = fakeRpc({ kind: "failure", failure: { class: "provider_unavailable", message: "provider down" } });
    const result = await observePausedState(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "unavailable", evidence: { detail: "provider down" } });
  });

  it("detects verified mint capability but leaves authorization unresolved", () => {
    const result = analyzeMintCapability({
      contractAddress: CONTRACT,
      codeAddress: IMPLEMENTATION,
      verifiedAbi: ABI_WITH_MINT,
    });

    expect(result).toMatchObject({
      capability: "mint",
      status: "positive",
      conclusive: true,
      detectionMethod: "verified_abi",
      authority: "unknown",
    });
  });

  it("classifies a verified ABI without mint as a conclusive negative", () => {
    const result = analyzeMintCapability({
      contractAddress: CONTRACT,
      verifiedAbi: [{ type: "function", name: "transfer", inputs: [{ type: "address" }, { type: "uint256" }] }],
    });

    expect(result).toMatchObject({ capability: "mint", status: "negative", conclusive: true });
  });

  it("never makes bytecode selector fallback conclusive", () => {
    const bytecode = "0x63" + "40c10f19" + "600052";
    const result = analyzeMintCapability({ contractAddress: CONTRACT, bytecode });

    expect(result).toMatchObject({
      capability: "mint",
      status: "inconclusive",
      conclusive: false,
      detectionMethod: "bytecode_fallback",
    });
  });

  it("does not treat a selector embedded in PUSH data as a mint finding", () => {
    const bytecode = "0x7f" + "40c10f19".padEnd(64, "0") + "00";
    const result = analyzeMintCapability({ contractAddress: CONTRACT, bytecode });

    expect(result).toMatchObject({ capability: "mint", status: "inconclusive", conclusive: false });
    expect(result.evidence.selectors).toEqual([]);
  });

  it("rejects malformed ABI input safely", () => {
    expect(() => hasVerifiedFunction([{ type: "function", name: "mint", inputs: "bad" }], ["mint"])).toThrow(
      "Malformed ABI",
    );
  });
});
