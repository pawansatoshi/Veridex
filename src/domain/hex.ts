const HEX = /^0x(?:[0-9a-fA-F]{2})*$/;

export function assertHex(value: string, label = "hex"): string {
  if (!HEX.test(value)) {
    throw new Error(`Invalid ${label}: expected an even-length 0x-prefixed hex string`);
  }
  return value;
}

export function hexToBytes(value: string, label = "hex"): Uint8Array {
  assertHex(value, label);
  const bytes = new Uint8Array((value.length - 2) / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    const offset = 2 + i * 2;
    bytes[i] = Number.parseInt(value.slice(offset, offset + 2), 16);
  }
  return bytes;
}

export function assertBytecode(value: string, maxBytes = 1_000_000): string {
  assertHex(value, "bytecode");
  const byteLength = (value.length - 2) / 2;
  if (byteLength > maxBytes) {
    throw new Error(`Bytecode exceeds maximum supported size of ${maxBytes} bytes`);
  }
  return value;
}
