import { describe, expect, it } from "vitest";
import { loadRuntimeConfig } from "../../src/infrastructure/config.js";

describe("runtime configuration", () => {
  it("requires an absolute HTTP(S) RPC URL", () => {
    expect(() => loadRuntimeConfig({})).toThrow("VERIDEX_RPC_URL is required");
    expect(() => loadRuntimeConfig({ VERIDEX_RPC_URL: "rpc.example.test" })).toThrow("Invalid VERIDEX_RPC_URL");
    expect(() => loadRuntimeConfig({ VERIDEX_RPC_URL: "file:///tmp/rpc" })).toThrow("Invalid VERIDEX_RPC_URL");
  });

  it("applies safe defaults and bounded overrides", () => {
    const config = loadRuntimeConfig({
      VERIDEX_RPC_URL: "https://rpc.example.test",
      VERIDEX_RPC_TIMEOUT_MS: "5000",
      VERIDEX_RPC_MAX_RETRIES: "1",
    });

    expect(config.rpcTimeoutMs).toBe(5_000);
    expect(config.rpcMaxRetries).toBe(1);
    expect(config.rpcRetryBaseMs).toBe(100);
    expect(config.circuitFailureThreshold).toBe(3);
  });

  it("rejects unbounded or malformed numeric configuration", () => {
    expect(() => loadRuntimeConfig({
      VERIDEX_RPC_URL: "https://rpc.example.test",
      VERIDEX_RPC_MAX_RETRIES: "99",
    })).toThrow("VERIDEX_RPC_MAX_RETRIES");
  });
});
