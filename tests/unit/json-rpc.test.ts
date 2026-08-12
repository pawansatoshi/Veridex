import { describe, expect, it, vi } from "vitest";
import { JsonRpcClient, RpcApplicationRevert } from "../../src/infra/json-rpc.js";
const address = "0x1111111111111111111111111111111111111111";
function response(body: unknown, status = 200): Response { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }); }

describe("JsonRpcClient", () => {
  it("classifies a JSON-RPC execution revert as application evidence", async () => {
    const fetcher = vi.fn(async () => response({ jsonrpc: "2.0", id: 1, error: { code: -32000, message: "execution reverted", data: "0x08c379a0" } }));
    const client = new JsonRpcClient("https://rpc.example", { fetcher, breaker: { failureThreshold: 2, cooldownMs: 10_000 }, retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 } });
    await expect(client.call(address, "0x70a08231")).rejects.toBeInstanceOf(RpcApplicationRevert);
    await expect(client.call(address, "0x70a08231")).rejects.toBeInstanceOf(RpcApplicationRevert);
    await expect(client.call(address, "0x70a08231")).rejects.toBeInstanceOf(RpcApplicationRevert);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
  it("opens on actual provider HTTP failures", async () => {
    const fetcher = vi.fn(async () => response({ error: "down" }, 503));
    const client = new JsonRpcClient("https://rpc.example", { fetcher, breaker: { failureThreshold: 2, cooldownMs: 10_000 }, retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 } });
    await expect(client.call(address, "0x")).rejects.toThrow(/HTTP 503/); await expect(client.call(address, "0x")).rejects.toThrow(/HTTP 503/); await expect(client.call(address, "0x")).rejects.toThrow(/Circuit breaker is open/); expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("classifies a timeout separately from an application revert", async () => {
    const fetcher = vi.fn((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => { init?.signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true }); }));
    const client = new JsonRpcClient("https://rpc.example", { fetcher, timeoutMs: 5, retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 } });
    await expect(client.call(address, "0x")).rejects.toMatchObject({ failure: { kind: "timeout" } });
  });
  it("accepts JSON-RPC QUANTITY block tags such as 0x1", async () => {
    const fetcher = vi.fn(async () => response({ jsonrpc: "2.0", id: 1, result: "0x" }));
    const client = new JsonRpcClient("https://rpc.example", { fetcher, retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 } });
    await expect(client.getCode(address, "0x1")).resolves.toBe("0x");
  });
  it("rejects malformed RPC results", async () => {
    const fetcher = vi.fn(async () => response({ jsonrpc: "2.0", id: 1, result: "0x123" }));
    const client = new JsonRpcClient("https://rpc.example", { fetcher, retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 } });
    await expect(client.getStorageAt(address, `0x${"00".repeat(32)}`)).rejects.toThrow();
  });
});
