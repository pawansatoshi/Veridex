import { describe, expect, it } from "vitest";
import { findPush4Constants, isPush0, walkEvmBytecode } from "../../src/domain/bytecode.js";

describe("EVM bytecode walker", () => {
  it("treats PUSH data as operands rather than instructions", () => {
    const analysis = walkEvmBytecode("0x63deadbeef5b");

    expect(analysis.instructions).toHaveLength(2);
    expect(analysis.instructions[0]).toMatchObject({ offset: 0, opcode: 0x63 });
    expect(analysis.instructions[1]).toMatchObject({ offset: 5, opcode: 0x5b });
  });

  it("does not report a selector hidden inside PUSH data", () => {
    const analysis = walkEvmBytecode("0x7f112233445566778899aabbccddeeff00112233445566778899aabbccddeeff");
    const selectors = findPush4Constants("0x7f112233445566778899aabbccddeeff00112233445566778899aabbccddeeff");

    expect(analysis.instructions).toHaveLength(1);
    expect(selectors).toEqual([]);
  });

  it("reports only actual PUSH4 instructions", () => {
    const selectors = findPush4Constants("0x60106311223344555b");

    expect(selectors).toEqual([{ offset: 2, selector: "0x11223344" }]);
  });

  it("rejects malformed hexadecimal and truncated PUSH operands", () => {
    expect(() => walkEvmBytecode("0x123")).toThrow("even length");
    expect(() => walkEvmBytecode("0x6a0102")).toThrow("exceeds bytecode length");
  });

  it("handles PUSH0 as a single-byte opcode", () => {
    expect(isPush0(0x5f)).toBe(true);
    expect(walkEvmBytecode("0x5f5b").instructions).toHaveLength(2);
  });
});
