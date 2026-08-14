import { describe, expect, it, vi } from "vitest";
import {
  EIP1967_ADMIN_SLOT,
  EIP1967_BEACON_SLOT,
  EIP1967_IMPLEMENTATION_SLOT,
  IBEACON_IMPLEMENTATION_SELECTOR,
  LEGACY_IMPLEMENTATION_SELECTOR,
  resolveProxy,
} from "../../src/infrastructure/proxy.js";
import type { JsonRpcClient } from "../../src/infrastructure/rpc.js";

const CONTRACT = "0x0000000000000000000000000000000000000001";
const IMPLEMENTATION = "0x1111111111111111111111111111111111111111";
const BEACON = "0x2222222222222222222222222222222222222222";
const ADMIN = "0x3333333333333333333333333333333333333333";
const ZERO_SLOT = `0x${"0".repeat(64)}`;
const slotFor = (address: string) => `0x${"0".repeat(24)}${address.slice(2)}`;

function fakeRpc(results: unknown[]): JsonRpcClient {
  return { call: vi.fn().mockImplementation(async () => results.shift()) } as unknown as JsonRpcClient;
}

describe("EIP-1967 and legacy proxy resolution", () => {
  it("resolves a direct implementation slot", async () => {
    const rpc = fakeRpc([
      { kind: "success", value: slotFor(IMPLEMENTATION) },
      { kind: "success", value: ZERO_SLOT },
      { kind: "success", value: slotFor(ADMIN) },
    ]);
    const result = await resolveProxy(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "implementation_resolved", codeAddress: IMPLEMENTATION, evidence: { implementationAddress: IMPLEMENTATION, adminAddress: ADMIN } });
  });

  it("resolves a beacon implementation and preserves beacon evidence", async () => {
    const rpc = fakeRpc([
      { kind: "success", value: ZERO_SLOT },
      { kind: "success", value: slotFor(BEACON) },
      { kind: "success", value: ZERO_SLOT },
      { kind: "success", value: slotFor(IMPLEMENTATION) },
    ]);
    const result = await resolveProxy(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "beacon_resolved", codeAddress: IMPLEMENTATION, evidence: { beaconAddress: BEACON, implementationAddress: IMPLEMENTATION } });
  });

  it("leaves a beacon explicitly unresolved when implementation() fails", async () => {
    const rpc = fakeRpc([
      { kind: "success", value: ZERO_SLOT },
      { kind: "success", value: slotFor(BEACON) },
      { kind: "success", value: ZERO_SLOT },
      { kind: "failure", failure: { class: "application_revert", message: "reverted" } },
    ]);
    const result = await resolveProxy(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "beacon_unresolved", evidence: { beaconAddress: BEACON } });
  });

  it("resolves a legacy implementation() getter when EIP-1967 slots are empty", async () => {
    const rpc = fakeRpc([
      { kind: "success", value: ZERO_SLOT },
      { kind: "success", value: ZERO_SLOT },
      { kind: "success", value: ZERO_SLOT },
      { kind: "success", value: slotFor(IMPLEMENTATION) },
    ]);
    const result = await resolveProxy(rpc, CONTRACT);

    expect(result).toMatchObject({
      status: "implementation_resolved",
      codeAddress: IMPLEMENTATION,
      evidence: { implementationAddress: IMPLEMENTATION, implementationSelector: LEGACY_IMPLEMENTATION_SELECTOR },
    });
  });

  it("classifies an address with no proxy evidence as direct", async () => {
    const rpc = fakeRpc([
      { kind: "success", value: ZERO_SLOT },
      { kind: "success", value: ZERO_SLOT },
      { kind: "success", value: ZERO_SLOT },
      { kind: "failure", failure: { class: "application_revert", message: "execution reverted" } },
    ]);
    const result = await resolveProxy(rpc, CONTRACT);

    expect(result.status).toBe("direct");
  });

  it("does not fabricate proxy evidence when storage access fails", async () => {
    const rpc = fakeRpc([
      { kind: "failure", failure: { class: "provider_unavailable", message: "rpc down" } },
      { kind: "failure", failure: { class: "provider_unavailable", message: "rpc down" } },
      { kind: "failure", failure: { class: "provider_unavailable", message: "rpc down" } },
    ]);
    const result = await resolveProxy(rpc, CONTRACT);

    expect(result).toMatchObject({ status: "unavailable", evidence: { detail: "rpc down" } });
  });

  it("uses the EIP-1967 slots and exact implementation selectors", async () => {
    const call = vi.fn().mockResolvedValue({ kind: "success", value: ZERO_SLOT });
    const rpc = { call } as unknown as JsonRpcClient;
    await resolveProxy(rpc, CONTRACT);

    expect(call).toHaveBeenNthCalledWith(1, "eth_getStorageAt", [CONTRACT, EIP1967_IMPLEMENTATION_SLOT, "latest"]);
    expect(call).toHaveBeenNthCalledWith(2, "eth_getStorageAt", [CONTRACT, EIP1967_BEACON_SLOT, "latest"]);
    expect(call).toHaveBeenNthCalledWith(3, "eth_getStorageAt", [CONTRACT, EIP1967_ADMIN_SLOT, "latest"]);
    expect(call).toHaveBeenNthCalledWith(4, "eth_call", [{ to: CONTRACT, data: LEGACY_IMPLEMENTATION_SELECTOR }, "latest"]);
    expect(IBEACON_IMPLEMENTATION_SELECTOR).toBe("0x5c60da1b");
    expect(LEGACY_IMPLEMENTATION_SELECTOR).toBe("0x5c60da1b");
  });
});
