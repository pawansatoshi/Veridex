import { describe, expect, it } from "vitest";
import { detectErc1967Proxy, ERC1967_BEACON_SLOT, ERC1967_IMPLEMENTATION_SLOT } from "../../src/domain/proxy.js";
import type { RpcTransport } from "../../src/infra/json-rpc.js";

const proxy = "0x1111111111111111111111111111111111111111";
const implementation = "0x2222222222222222222222222222222222222222";
const beacon = "0x3333333333333333333333333333333333333333";
const zero = `0x${"00".repeat(32)}`;
function slot(address: string): string { return `0x${"00".repeat(12)}${address.slice(2)}`; }

function rpc(values: Record<string, string>): RpcTransport {
  return {
    request: async () => { throw new Error("unused"); },
    getCode: async () => "0x",
    getStorageAt: async (_address, key) => values[key] ?? zero,
    call: async () => "0x",
  };
}

describe("ERC-1967 proxy evidence", () => {
  it("resolves a direct implementation slot without changing storage semantics", async () => {
    const result = await detectErc1967Proxy(rpc({ [ERC1967_IMPLEMENTATION_SLOT]: slot(implementation) }), proxy);
    expect(result.evidence).toEqual({ isProxy: true, proxyType: "unknown", implementationAddress: implementation });
  });

  it("detects a beacon but deliberately leaves implementation unresolved", async () => {
    const result = await detectErc1967Proxy(rpc({ [ERC1967_BEACON_SLOT]: slot(beacon) }), proxy);
    expect(result.evidence).toEqual({ isProxy: true, proxyType: "beacon", beaconAddress: beacon });
    expect(result.evidence.implementationAddress).toBeUndefined();
  });

  it("returns a negative observation when both relevant slots are zero", async () => {
    const result = await detectErc1967Proxy(rpc({}), proxy);
    expect(result.evidence).toEqual({ isProxy: false });
  });
});
