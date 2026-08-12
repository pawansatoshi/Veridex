import { describe, expect, it } from "vitest";
import { assertEvmAddress, isEvmAddress } from "../../src/domain/address.js";

describe("EVM address validation", () => {
  it("accepts a canonical 20-byte address", () => {
    expect(isEvmAddress("0x0000000000000000000000000000000000000001")).toBe(true);
  });

  it("rejects malformed addresses", () => {
    expect(isEvmAddress("0x1234")).toBe(false);
    expect(isEvmAddress("0000000000000000000000000000000000000001")).toBe(false);
    expect(isEvmAddress("0x00000000000000000000000000000000000000zz")).toBe(false);
  });

  it("throws with a useful error for invalid input", () => {
    expect(() => assertEvmAddress("0x608", "implementation"))
      .toThrow("Invalid EVM implementation");
  });
});
