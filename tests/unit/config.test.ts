import { describe, expect, it } from "vitest";
import { validateRuntimeConfig } from "../../src/infra/config.js";

describe("runtime configuration", () => {
  const valid = { rpcUrl: "https://rpc.example", chain: "mainnet", rpcTimeoutMs: 5000, rpcMaxAttempts: 2, maxConcurrency: 4, maxBytecodeBytes: 500_000 };
  it("accepts bounded configuration", () => expect(validateRuntimeConfig(valid)).toEqual(valid));
  it("rejects unsafe or unbounded values", () => {
    expect(() => validateRuntimeConfig({ ...valid, rpcUrl: "file:///tmp/rpc" })).toThrow();
    expect(() => validateRuntimeConfig({ ...valid, maxConcurrency: 1000 })).toThrow();
    expect(() => validateRuntimeConfig({ ...valid, maxBytecodeBytes: 2_000_000 })).toThrow();
  });
});
