export interface RuntimeConfig {
  rpcUrl: string;
  rpcTimeoutMs: number;
  rpcMaxRetries: number;
  rpcRetryBaseMs: number;
  circuitFailureThreshold: number;
  circuitResetTimeoutMs: number;
}

const DEFAULTS = {
  rpcTimeoutMs: 8_000,
  rpcMaxRetries: 2,
  rpcRetryBaseMs: 100,
  circuitFailureThreshold: 3,
  circuitResetTimeoutMs: 30_000,
} as const;

const DEFAULT_PUBLIC_ETHEREUM_RPC = "https://ethereum-rpc.publicnode.com";

function boundedInteger(name: string, value: string | undefined, fallback: number, min: number, max: number): number {
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value)) throw new Error(`Invalid ${name}: expected an integer`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid ${name}: expected integer in [${min}, ${max}]`);
  }
  return parsed;
}

export function loadRuntimeConfig(env: Record<string, string | undefined>): RuntimeConfig {
  const rpcUrl = env.VERIDEX_RPC_URL || DEFAULT_PUBLIC_ETHEREUM_RPC;

  let parsed: URL;
  try {
    parsed = new URL(rpcUrl);
  } catch {
    throw new Error("Invalid VERIDEX_RPC_URL: expected an absolute URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Invalid VERIDEX_RPC_URL: expected http or https");
  }

  return {
    rpcUrl: parsed.toString(),
    rpcTimeoutMs: boundedInteger("VERIDEX_RPC_TIMEOUT_MS", env.VERIDEX_RPC_TIMEOUT_MS, DEFAULTS.rpcTimeoutMs, 100, 30_000),
    rpcMaxRetries: boundedInteger("VERIDEX_RPC_MAX_RETRIES", env.VERIDEX_RPC_MAX_RETRIES, DEFAULTS.rpcMaxRetries, 0, 5),
    rpcRetryBaseMs: boundedInteger("VERIDEX_RPC_RETRY_BASE_MS", env.VERIDEX_RPC_RETRY_BASE_MS, DEFAULTS.rpcRetryBaseMs, 10, 2_000),
    circuitFailureThreshold: boundedInteger("VERIDEX_CIRCUIT_FAILURE_THRESHOLD", env.VERIDEX_CIRCUIT_FAILURE_THRESHOLD, DEFAULTS.circuitFailureThreshold, 1, 20),
    circuitResetTimeoutMs: boundedInteger("VERIDEX_CIRCUIT_RESET_MS", env.VERIDEX_CIRCUIT_RESET_MS, DEFAULTS.circuitResetTimeoutMs, 1_000, 300_000),
  };
}
