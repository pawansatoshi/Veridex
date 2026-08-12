import { describe, expect, it } from "vitest";
import { checkMintCapability, checkOwnership, checkPauseCapability, checkPausedState, type AnalysisContext } from "../../src/domain/checks.js";
import { RpcApplicationRevert, type RpcTransport } from "../../src/infra/json-rpc.js";
import type { VerificationClient } from "../../src/infra/verification.js";

const contractAddress = "0x1111111111111111111111111111111111111111";
const owner = "0x2222222222222222222222222222222222222222";
function wordAddress(address: string): string { return `0x${"00".repeat(12)}${address.slice(2)}`; }
function wordBool(value: boolean): string { return `0x${"00".repeat(31)}${value ? "01" : "00"}`; }
function rpc(callResult: string): RpcTransport { return { request: async () => { throw new Error("unused"); }, getCode: async () => "0x", getStorageAt: async () => `0x${"00".repeat(32)}`, call: async () => callResult }; }
function context(rpcClient: RpcTransport, verification?: VerificationClient): AnalysisContext { return { requestedAddress: contractAddress, contractAddress, chain: "test", rpc: rpcClient, ...(verification ? { verification } : {}) }; }

describe("deterministic capability checks", () => {
  it("uses verified ABI before bytecode fallback", async () => {
    const verification: VerificationClient = { getContract: async () => ({ status: "verified", abi: [{ type: "function", name: "paused", inputs: [] }] }) };
    const result = await checkPauseCapability(context(rpc("0x"), verification));
    expect(result.status).toBe("positive");
    expect(result.detectionMethod).toBe("verified_abi");
    expect(result.provenance?.tier).toBe("verified_abi");
  });

  it("uses instruction-aligned fallback for an unverified contract", async () => {
    const verification: VerificationClient = { getContract: async () => ({ status: "unverified", detail: "source unavailable" }) };
    const rpcClient: RpcTransport = { ...rpc("0x"), getCode: async () => "0x635c975abb00" };
    const result = await checkPauseCapability(context(rpcClient, verification));
    expect(result.status).toBe("positive");
    expect(result.detectionMethod).toBe("bytecode_fallback");
    expect(result.provenance?.failure).toBe("unverified_contract");
  });

  it("keeps a contract-level owner revert inconclusive", async () => {
    const verification: VerificationClient = { getContract: async () => ({ status: "verified", abi: [{ type: "function", name: "owner", inputs: [] }] }) };
    const rpcClient: RpcTransport = { ...rpc("0x"), call: async () => { throw new RpcApplicationRevert("execution reverted"); } };
    const result = await checkOwnership(context(rpcClient, verification));
    expect(result.status).toBe("unavailable");
    expect(result.certaintyStatus).toBe("inconclusive");
    expect(result.failure).toBe("rpc_revert");
  });

  it("reads live owner state from contractAddress", async () => {
    const verification: VerificationClient = { getContract: async () => ({ status: "verified", abi: [{ type: "function", name: "owner", inputs: [] }] }) };
    const calls: string[] = [];
    const rpcClient: RpcTransport = { ...rpc(wordAddress(owner)), call: async (to) => { calls.push(to); return wordAddress(owner); } };
    const result = await checkOwnership({ ...context(rpcClient, verification), codeAddress: "0x3333333333333333333333333333333333333333" });
    expect(result.status).toBe("negative");
    expect(calls).toEqual([contractAddress]);
  });

  it("separates pause capability from live paused state", async () => {
    const verification: VerificationClient = { getContract: async () => ({ status: "verified", abi: [{ type: "function", name: "paused", inputs: [] }] }) };
    const capability = await checkPauseCapability(context(rpc("0x"), verification));
    const state = await checkPausedState({ ...context(rpc(wordBool(true)), verification) }, capability);
    expect(capability.status).toBe("positive");
    expect(state.status).toBe("positive");
    expect(state.passed).toBe(false);
  });

  it("does not claim mint authority from function presence alone", async () => {
    const verification: VerificationClient = { getContract: async () => ({ status: "verified", abi: [{ type: "function", name: "mint", inputs: [{ type: "address" }, { type: "uint256" }] }] }) };
    const result = await checkMintCapability(context(rpc("0x"), verification));
    expect(result.status).toBe("positive");
    expect(result.evidence.authority).toBe("unknown");
  });
});
