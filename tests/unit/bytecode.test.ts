import { describe, expect, it } from "vitest";
import { findPush4Selectors, walkEvmInstructions } from "../../src/domain/bytecode.js";
import { assertBytecode, assertHex } from "../../src/domain/hex.js";

describe("hex and EVM bytecode validation", () => {
  it("rejects odd-length and non-hex input", () => {
    expect(() => assertHex("0x608")).toThrow();
    expect(() => assertHex("0xzz")).toThrow();
    expect(() => assertHex("6080")).toThrow();
  });

  it("rejects malformed bytecode before scanning", () => {
    expect(() => assertBytecode("0x608")).toThrow();
    expect(() => walkEvmInstructions("0x63abcd")).toThrow(/Truncated PUSH4/);
  });

  it("walks PUSH data as one instruction and avoids selector decoys", () => {
    const selector = "0x8da5cb5b";
    const decoy = `0x7f${"00".repeat(28)}8da5cb5b`;
    expect(findPush4Selectors(decoy, [selector])).toEqual([]);
    expect(findPush4Selectors(`0x638da5cb5b00`, [selector])).toEqual([selector]);
  });

  it("allows empty bytecode as a valid empty byte sequence", () => {
    expect(walkEvmInstructions("0x")).toEqual([]);
    expect(assertBytecode("0x")).toBe("0x");
  });
});
