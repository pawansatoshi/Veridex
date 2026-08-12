import { describe, expect, it, vi } from "vitest";
import { JsonRpcClient } from "../../src/infrastructure/rpc.js";
import type { RuntimeConfig } from "../../src/infrastructure/config.js";

const config: RuntimeConfig = {
  rpcUrl: "https://rpc.example.test",
  rpcTimeoutMs: 100,
  rpcMaxRetries: 0,
  rpcRetryBaseMs: 10,
  circuitFailureThreshold: 1,
  circuitResetTimeoutMs: 1_000,
};

describe("JsonRpcClient", () => {
  it("returns an application-level revert without opening the circuit", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      error: { code: -32000, message: "execution reverted" },
    }), { status: 200, headers: { "content-type": "application/json" } }));

    const client = new JsonRpcClient(config, fetchImpl);
    const first = await client.call("eth_call", []);
    const second = await client.call("eth_call", []);

    expect(first).toMatchObject({ kind: "failure", failure: { class: "application_revert", countsTowardCircuit: false } });
    expect(second).toMatchObject({ kind: "failure", failure: { class: "application_revert" } });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("opens the circuit after an infrastructure failure", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(new Error("network unavailable"));
    const client = new JsonRpcClient(config, fetchImpl);

    const first = await client.call("eth_blockNumber", []);
    const second = await client.call("eth_blockNumber", []);

    expect(first).toMatchObject({ kind: "failure", failure: { class: "provider_unavailable" } });
    expect(second).toMatchObject({ kind: "failure", failure: { class: "circuit_open" } });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
