import { describe, expect, it, vi } from "vitest";
import { decodeAddressResult, normalizeOwnerAddress, observeOwner, OWNABLE_OWNER_SELECTOR, validateFunctionSelector } from "../../src/domain/ownership.js";
import type { JsonRpcClient } from "../../src/infrastructure/rpc.js";

const CONTRACT = "0x0000000000000000000000000000000000000001";
const OWNER = "0x1111111111111111111111111111111111111111";
const ENCODED_OWNER = `0x${"0".repeat(24)}${OWNER.slice(2)}`;

function fakeRpc(result: unknown): JsonRpcClient {
  return { call: vi.fn().mockResolvedValue(result) } as unknown as JsonRpcClient;
}

describe("ownership observation", () => {
  it("validates selectors and decodes ABI address results", () => {
    expect(validateFunctionSelector(OWNABLE_OWNER_SELECTOR)).toBe(OWNABLE_OWNER_SELECTOR);
    expect(decodeAddressResult(ENCODED_OWNER)).toBe(OWNER);
    expect(decodeAddressResult("0x")).toBeUndefined();
    expect(() => validateFunctionSelector("0x1234")).toThrow("Invalid function selector");
    expect(() => decodeAddressResult("0x1234")).toThrow("expected one ABI-encoded address");
  });

  it("classifies an active owner", async () => {
    const rpc = fakeRpc({ kind: "success", value: ENCODED_OWNER });
    const result = await observeOwner(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "owner_found", ownerAddress: OWNER, detectionMethod: "verified_abi" });
  });

  it("classifies a renounced owner", async () => {
    const rpc = fakeRpc({ kind: "success", value: `0x${"0".repeat(64)}` });
    const result = await observeOwner(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "renounced", ownerAddress: "0x0000000000000000000000000000000000000000" });
  });

  it("does not turn RPC infrastructure failure into ownership evidence", async () => {
    const rpc = fakeRpc({ kind: "failure", failure: { class: "provider_unavailable", message: "down" } });
    const result = await observeOwner(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "unavailable", evidence: { detail: "down" } });
  });

  it("treats an owner() revert as non-applicable", async () => {
    const rpc = fakeRpc({ kind: "failure", failure: { class: "application_revert", message: "execution reverted" } });
    const result = await observeOwner(rpc, CONTRACT);

    expect(result.status).toBe("not_applicable");
  });

  it("rejects malformed owner return data without creating a finding", async () => {
    const rpc = fakeRpc({ kind: "success", value: "0x1234" });
    const result = await observeOwner(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "error", evidence: { queriedAddress: CONTRACT } });
  });

  it("normalizes owner addresses deterministically", () => {
    expect(normalizeOwnerAddress(OWNER.toUpperCase().replace("X", "x"))).toBe(OWNER);
  });
});
