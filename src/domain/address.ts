const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/;
const HEX_32_BYTE_ADDRESS = /^0x[0-9a-fA-F]{64}$/;
const APTOS_SHORT_ADDRESS = /^0x[0-9a-fA-F]{1,64}$/;
const SOLANA_BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const BITCOIN_BECH32 = /^(bc1|tb1)[ac-hj-np-z02-9]{11,87}$/i;
const CARDANO_ADDRESS = /^(addr1|addr_test1|stake1|stake_test1)[0-9a-z]+$/i;
const COSMOS_BECH32 = /^[a-z0-9]+1[ac-hj-np-z02-9]{20,90}$/;
const TRON_BASE58 = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;
const NEAR_IMPLICIT = /^[0-9a-fA-F]{64}$/;
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export type DetectedAddressKind = "evm_account_or_contract" | "sui" | "aptos" | "near" | "solana" | "bitcoin" | "tron" | "cardano" | "cosmos" | "unknown";

export interface AddressDetection {
  kind: DetectedAddressKind;
  label: string;
  confidence: "high" | "medium" | "low";
  supportedForAnalysis: boolean;
  reason: string;
}

export function assertEvmAddress(value: string, label = "address"): string {
  if (!EVM_ADDRESS.test(value)) throw new Error(`Invalid EVM ${label}: expected a 20-byte 0x-prefixed address`);
  return value;
}

export function isEvmAddress(value: string): boolean {
  return EVM_ADDRESS.test(value);
}

function base58Decode(value: string): Uint8Array | undefined {
  if (!value || !/^[1-9A-HJ-NP-Za-km-z]+$/.test(value)) return undefined;
  const digits = [0];
  for (const character of value) {
    const index = BASE58_ALPHABET.indexOf(character);
    if (index < 0) return undefined;
    let carry = index;
    for (let i = 0; i < digits.length; i += 1) {
      carry += digits[i] * 58;
      digits[i] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) { digits.push(carry & 0xff); carry >>= 8; }
  }
  let leadingZeroes = 0;
  while (leadingZeroes < value.length && value[leadingZeroes] === "1") leadingZeroes += 1;
  const output = new Uint8Array(leadingZeroes + digits.length);
  for (let i = 0; i < digits.length; i += 1) output[output.length - 1 - i] = digits[i];
  return output;
}

export function detectAddress(value: string): AddressDetection {
  const input = value.trim();
  if (EVM_ADDRESS.test(input)) return { kind: "evm_account_or_contract", label: "Ethereum / EVM address", confidence: "high", supportedForAnalysis: true, reason: "20-byte hexadecimal EVM address format" };
  if (HEX_32_BYTE_ADDRESS.test(input)) return { kind: "sui", label: "Sui / 32-byte hex address", confidence: "medium", supportedForAnalysis: false, reason: "32-byte hexadecimal format used by Sui and other Move chains" };
  if (APTOS_SHORT_ADDRESS.test(input) && input.startsWith("0x") && input.length !== 42) return { kind: "aptos", label: "Aptos / Move address", confidence: "medium", supportedForAnalysis: false, reason: "0x-prefixed Move address format" };
  if (NEAR_IMPLICIT.test(input)) return { kind: "near", label: "NEAR implicit account", confidence: "high", supportedForAnalysis: false, reason: "64-character hexadecimal implicit account format" };
  if (BITCOIN_BECH32.test(input)) return { kind: "bitcoin", label: "Bitcoin address", confidence: "high", supportedForAnalysis: false, reason: "Bitcoin bech32/bech32m prefix" };
  if (CARDANO_ADDRESS.test(input)) return { kind: "cardano", label: "Cardano address", confidence: "high", supportedForAnalysis: false, reason: "Cardano Shelley address prefix" };
  if (TRON_BASE58.test(input)) return { kind: "tron", label: "TRON address", confidence: "high", supportedForAnalysis: false, reason: "TRON Base58 address format" };
  if (COSMOS_BECH32.test(input)) return { kind: "cosmos", label: "Cosmos / IBC bech32 address", confidence: "medium", supportedForAnalysis: false, reason: "Cosmos SDK bech32 account format" };
  const decoded = base58Decode(input);
  if (decoded?.length === 32 && SOLANA_BASE58.test(input)) return { kind: "solana", label: "Solana address", confidence: "high", supportedForAnalysis: false, reason: "Base58-decoded public key is exactly 32 bytes" };
  return { kind: "unknown", label: "Unknown blockchain address", confidence: "low", supportedForAnalysis: false, reason: "No supported address format matched" };
}
