export interface EvmInstruction {
  offset: number;
  opcode: number;
  pushData?: Uint8Array;
  truncatedPush?: boolean;
}

export interface BytecodeAnalysis {
  byteLength: number;
  instructions: readonly EvmInstruction[];
}

const MAX_BYTECODE_BYTES = 1_048_576;
const PUSH0 = 0x5f;
const PUSH1 = 0x60;
const PUSH32 = 0x7f;

function decodeHex(value: string): Uint8Array {
  if (!/^0x[0-9a-fA-F]*$/.test(value)) throw new Error("Malformed bytecode: expected 0x-prefixed hexadecimal data");
  const hex = value.slice(2);
  if (hex.length % 2 !== 0) throw new Error("Malformed bytecode: hexadecimal data must have even length");
  if (hex.length / 2 > MAX_BYTECODE_BYTES) throw new Error(`Malformed bytecode: exceeds ${MAX_BYTECODE_BYTES} byte parser limit`);

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

export function walkEvmBytecode(bytecode: string): BytecodeAnalysis {
  const bytes = decodeHex(bytecode);
  const instructions: EvmInstruction[] = [];

  for (let offset = 0; offset < bytes.length;) {
    const opcode = bytes[offset];
    if (opcode === undefined) throw new Error("Malformed bytecode: unexpected end of instruction stream");

    if (opcode >= PUSH1 && opcode <= PUSH32) {
      const pushLength = opcode - PUSH1 + 1;
      const dataStart = offset + 1;
      const dataEnd = dataStart + pushLength;
      const truncatedPush = dataEnd > bytes.length;
      const actualEnd = Math.min(dataEnd, bytes.length);

      instructions.push({
        offset,
        opcode,
        pushData: bytes.slice(dataStart, actualEnd),
        ...(truncatedPush ? { truncatedPush: true } : {}),
      });
      offset = actualEnd;
      continue;
    }

    instructions.push({ offset, opcode });
    offset += 1;
  }

  return { byteLength: bytes.length, instructions };
}

export function findPush4Constants(bytecode: string): readonly { offset: number; selector: string }[] {
  const analysis = walkEvmBytecode(bytecode);
  return analysis.instructions
    .filter((instruction) => instruction.opcode === 0x63 && instruction.pushData?.length === 4 && instruction.truncatedPush !== true)
    .map((instruction) => ({
      offset: instruction.offset,
      selector: `0x${Array.from(instruction.pushData ?? []).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`,
    }));
}

export function isPush0(opcode: number): boolean {
  return opcode === PUSH0;
}
