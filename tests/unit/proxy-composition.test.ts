import { describe, expect, it, vi } from "vitest";
import { resolveProxyComposition } from "../../src/infrastructure/proxy-composition.js";
import type { JsonRpcClient } from "../../src/infrastructure/rpc.js";

const ROOT = "0x0000000000000000000000000000000000000001";
const IMPLEMENTATION = "0x1111111111111111111111111111111111111111";
const IMPLEMENTATION_2 = "0x2222222222222222222222222222222222222222";
const ZERO = `0x${"0".repeat(64)}`;
const slotFor = (address: string) => `0x${"0".repeat(24)}${address.slice(2)}`;

function rpcForImplementationChain(chain: string[]) {
  const queue: unknown[] = [];
  for (const implementation of chain) {
    queue.push(
      { kind: "success", value: slotFor(implementation) },
      { kind: "success", value: ZERO },
      { kind: "success", value: ZERO },
      { kind: "success", value: ZERO },
      { kind: "success", value: ZERO },
    );
  }
  queue.push(...[
    { kind: "success", value: ZERO },
    { kind: "success", value: ZERO },
    { kind: "success", value: ZERO },
    { kind: "success", value: ZERO },
    { kind: "success", value: ZERO },
    { kind: "failure", failure: { class: "application_revert", message: "not a proxy" } },
  ]);
  return {
    call: vi.fn(async () => queue.shift()),
  } as unknown as JsonRpcClient;
}

describe("proxy-aware composition", () => {
  it("resolves nested implementation lineage and terminal code address", async () => {
    const rpc = rpcForImplementationChain([IMPLEMENTATION, IMPLEMENTATION_2]);
    const result = await resolveProxyComposition(rpc, ROOT, { maxDepth: 4 });

    expect(result.status).toBe("composed");
    expect(result.effectiveCodeAddress).toBe(IMPLEMENTATION_2);
    expect(result.observedImplementationLineage).toEqual([IMPLEMENTATION, IMPLEMENTATION_2]);
    expect(result.layers.map((layer) => layer.depth)).toEqual([0, 1, 2]);
    expect(result.layers[0]?.resolution.codeAddress).toBe(IMPLEMENTATION);
    expect(result.layers[1]?.resolution.codeAddress).toBe(IMPLEMENTATION_2);
    expect(result.layers[2]?.resolution.status).toBe("direct");
  });

  it("stops safely at the configured maximum depth", async () => {
    const rpc = rpcForImplementationChain([IMPLEMENTATION, IMPLEMENTATION_2]);
    const result = await resolveProxyComposition(rpc, ROOT, { maxDepth: 1 });

    expect(result.status).toBe("max_depth");
    expect(result.layers).toHaveLength(2);
    expect(result.effectiveCodeAddress).toBe(IMPLEMENTATION_2);
  });

  it("preserves unavailable provider state instead of inventing composition", async () => {
    const failure = { kind: "failure", failure: { class: "provider_unavailable", message: "rpc down" } };
    const rpc = { call: vi.fn(async () => failure) } as unknown as JsonRpcClient;
    const result = await resolveProxyComposition(rpc, ROOT);

    expect(result.status).toBe("unavailable");
    expect(result.layers).toHaveLength(1);
    expect(result.observedImplementationLineage).toEqual([]);
  });
});
