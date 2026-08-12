import { assertBytecode, hexToBytes } from "./hex.js";

export interface EvmInstruction {
  offset: number;
  opcode: number;
  pushData?: Uint8Array;
}

export function walkEvmInstructions(bytecode: string, maxInstructions = 250_000): EvmInstruction[] {
  const bytes = hexToBytes(assertBytecode(bytecode), "bytecode");
  const instructions: EvmInstruction[] = [];
  let offset = 0;

  while (offset < bytes.length) {
    if (instructions.length >= maxInstructions) {
      throw new Error(`Bytecode instruction count exceeds maximum of ${maxInstructions}`);
    }

    const opcode = bytes[offset];
    if (opcode === undefined) {
      throw new Error("Unexpected end of bytecode");
    }

    if (opcode >= 0x60 && opcode <= 0x7f) {
      const length = opcode - 0x5f;
      const end = offset + 1 + length;
      if (end > bytes.length) {
        throw new Error(`Truncated PUSH${length} at byte offset ${offset}`);
      }
      instructions.push({ offset, opcode, pushData: bytes.slice(offset + 1, end) });
      offset = end;
      continue;
    }

    instructions.push({ offset, opcode });
    offset += 1;
  }

  return instructions;
}

export function findPush4Selectors(bytecode: string, selectors: readonly string[]): string[] {
  const normalized = new Set(selectors.map((selector) => selector.toLowerCase()));
  const found = new Set<string>();

  for (const instruction of walkEvmInstructions(bytecode)) {
    if (instruction.opcode !== 0x63 || instruction.pushData === undefined) continue;
    const selector = `0x${Array.from(instruction.pushData, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
    if (normalized.has(selector)) found.add(selector);
  }

  return [...found];
}
