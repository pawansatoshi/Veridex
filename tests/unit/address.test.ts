import { describe, expect, it } from "vitest";
import { assertEvmAddress, detectAddress, isEvmAddress } from "../../src/domain/address.js";

describe("address detection", () => {
  it("accepts a canonical 20-byte EVM address", () => {
    expect(isEvmAddress("0x0000000000000000000000000000000000000001")).toBe(true);
    expect(detectAddress("0x1111111111111111111111111111111111111111").kind).toBe("evm_account_or_contract");
  });

  it("rejects malformed EVM addresses", () => {
    expect(isEvmAddress("0x1234")).toBe(false);
    expect(isEvmAddress("0000000000000000000000000000000000000001")).toBe(false);
    expect(isEvmAddress("0x00000000000000000000000000000000000000zz")).toBe(false);
    expect(() => assertEvmAddress("0x608", "implementation")).toThrow("Invalid EVM implementation");
  });

  it("recognizes non-EVM formats without pretending they are EVM contracts", () => {
    expect(detectAddress("bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh").kind).toBe("bitcoin");
    expect(detectAddress("T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb").kind).toBe("tron");
    expect(detectAddress("addr1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh").kind).toBe("cardano");
  });

  it("does not guess unknown addresses", () => {
    const result = detectAddress("not-a-real-address");
    expect(result.kind).toBe("unknown");
    expect(result.supportedForAnalysis).toBe(false);
  });
});
