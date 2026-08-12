const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;

export function assertEvmAddress(value: string, label = "address"): string {
  if (!EVM_ADDRESS.test(value)) {
    throw new Error(`Invalid EVM ${label}: expected a 20-byte 0x-prefixed address`);
  }
  return value;
}

export function isEvmAddress(value: string): boolean {
  return EVM_ADDRESS.test(value);
}
