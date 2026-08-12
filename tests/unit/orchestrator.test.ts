import { describe, expect, it } from "vitest";
import { AnalysisEngine } from "../../src/domain/orchestrator.js";
import { MemoryAnalysisEventSink } from "../../src/infra/telemetry.js";
import type { RpcTransport } from "../../src/infra/json-rpc.js";
import type { VerificationClient } from "../../src/infra/verification.js";

const proxy = "0x1111111111111111111111111111111111111111";
const implementation = "0x2222222222222222222222222222222222222222";
const beacon = "0x3333333333333333333333333333333333333333";
const owner = "0x4444444444444444444444444444444444444444";
const zero = `0x${"00".repeat(32)}`;
const wordAddress = `0x${"00".repeat(12)}${owner.slice(2)}`;
const wordFalse = `0x${"00".repeat(32)}`;

function rpc(storage: Record<string, string>): RpcTransport {
  return {
    request: async () => { throw new Error("unused"); },
    getCode: async () => "0x",
    getStorageAt: async (_address, slot) => storage[slot] ?? zero,
    call: async (_to, data) => data === "0x8da5cb5b" ? wordAddress : data === "0x5c975abb" ? wordFalse : "0x",
  };
}

const verification: VerificationClient = { getContract: async () => ({ status: "verified", abi: [
  { type: "function", name: "owner", inputs: [] },
  { type: "function", name: "paused", inputs: [] },
  { type: "function", name: "mint", inputs: [{ type: "address" }, { type: "uint256" }] },
] }) };

describe("Phase 01 normalized orchestration", () => {
  it("preserves proxy code/live-state separation and produces one normalized result", async () => {
    const events = new MemoryAnalysisEventSink();
    const engine = new AnalysisEngine({ maxConcurrency: 2, events });
    const result = await engine.analyze({ requestedAddress: proxy, contractAddress: proxy, chain: "test", rpc: rpc({ "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc": `0x${"00".repeat(12)}${implementation.slice(2)}` }), verification });
    expect(result.identity.codeAddress).toBe(implementation);
    expect(result.identity.contractAddress).toBe(proxy);
    expect(result.quality.status).toBe("conclusive");
    expect(result.checks).toHaveLength(4);
    expect(events.snapshot().map((event) => event.name)).toContain("RESULT_READY");
  });

  it("fails closed on an unresolved beacon instead of analyzing proxy code as implementation", async () => {
    const engine = new AnalysisEngine({ maxConcurrency: 2 });
    const result = await engine.analyze({ requestedAddress: proxy, contractAddress: proxy, chain: "test", rpc: rpc({ "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50": `0x${"00".repeat(12)}${beacon.slice(2)}` }), verification });
    expect(result.proxy.proxyType).toBe("beacon");
    expect(result.proxy.implementationAddress).toBeUndefined();
    expect(result.checks).toHaveLength(0);
    expect(result.quality.status).toBe("inconclusive");
    expect(result.errors.some((error) => error.kind === "unresolved_implementation")).toBe(true);
  });
});
