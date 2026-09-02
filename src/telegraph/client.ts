import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

export interface TelegraphAskResponse {
  miner_used?: string;
  miner_name?: string;
  endpoint?: string;
  result?: unknown;
  cost_usd?: number;
  duration_ms?: number;
  timestamp?: string;
  reasoning?: string;
  intent?: string;
  [key: string]: unknown;
}

export interface TelegraphPaymentProof {
  success?: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  amount?: string;
  errorReason?: string;
  [key: string]: unknown;
}

export interface TelegraphAskMetadata {
  requestId: string;
  payment: "not_required" | "required" | "settled" | "unavailable" | "failed";
  paymentNetwork?: string;
  paymentAmountAtomic?: string;
  paymentProof?: TelegraphPaymentProof;
  statusCode: number;
  elapsedMs: number;
}

export interface TelegraphAskResult {
  response: TelegraphAskResponse;
  metadata: TelegraphAskMetadata;
}

export interface TelegraphClientOptions {
  engineUrl: string;
  privateKey?: string;
  maxPaymentUsdc: number;
  allowedNetworks: readonly string[];
  timeoutMs: number;
}

const DEFAULT_ENGINE_URL = "http://13.237.89.59:7044/engine";
const DEFAULT_MAX_PAYMENT_USDC = 0.05;
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_ALLOWED_NETWORKS = ["eip155:84532", "base-sepolia"] as const;

function envNumber(name: string, fallback: number, min: number, max: number): number {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid ${name}: expected number in [${min}, ${max}]`);
  }
  return parsed;
}

function envUrl(name: string, fallback: string): string {
  const value = process.env[name] || fallback;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`Invalid ${name}: expected an absolute URL`);
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Invalid ${name}: expected http or https`);
  }
  return parsed.toString().replace(/\/$/, "");
}

export function loadTelegraphClientOptions(): TelegraphClientOptions {
  const configuredNetworks = (process.env.TELEGRAPH_ALLOWED_NETWORKS || DEFAULT_ALLOWED_NETWORKS.join(","))
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const privateKey = process.env.TELEGRAPH_EVM_PRIVATE_KEY;
  return {
    engineUrl: envUrl("TELEGRAPH_ENGINE_URL", DEFAULT_ENGINE_URL),
    ...(privateKey ? { privateKey } : {}),
    maxPaymentUsdc: envNumber("TELEGRAPH_MAX_PAYMENT_USDC", DEFAULT_MAX_PAYMENT_USDC, 0, 1),
    allowedNetworks: configuredNetworks,
    timeoutMs: envNumber("TELEGRAPH_TIMEOUT_MS", DEFAULT_TIMEOUT_MS, 2_000, 60_000),
  };
}

function decodeHeaderValue(header: string | null): unknown {
  if (!header) return undefined;
  try {
    return JSON.parse(Buffer.from(header, "base64").toString("utf8"));
  } catch {
    return undefined;
  }
}

function readPaymentRequirement(response: Response, maxPaymentUsdc: number, allowedNetworks: readonly string[]) {
  const required = decodeHeaderValue(response.headers.get("PAYMENT-REQUIRED"));
  if (!required || typeof required !== "object") {
    throw new Error("Telegraph returned HTTP 402 without a valid PAYMENT-REQUIRED header");
  }

  const accepts = Array.isArray((required as { accepts?: unknown }).accepts)
    ? (required as { accepts: unknown[] }).accepts
    : [];
  const candidate = accepts.find((item) => {
    if (!item || typeof item !== "object") return false;
    const network = String((item as { network?: unknown }).network ?? "");
    return allowedNetworks.includes(network);
  }) as { network?: unknown; amount?: unknown; scheme?: unknown; asset?: unknown } | undefined;

  if (!candidate) {
    throw new Error(`Telegraph payment network not allowed; accepted networks: ${allowedNetworks.join(", ")}`);
  }

  const atomicAmount = BigInt(String(candidate.amount ?? "0"));
  const maxAtomic = BigInt(Math.round(maxPaymentUsdc * 1_000_000));
  if (atomicAmount > maxAtomic) {
    throw new Error(`Telegraph payment exceeds safety cap: ${atomicAmount.toString()} micro-USDC > ${maxAtomic.toString()} micro-USDC`);
  }

  return {
    network: String(candidate.network),
    amountAtomic: atomicAmount.toString(),
    scheme: String(candidate.scheme ?? ""),
    asset: String(candidate.asset ?? ""),
  };
}

function makeTimeoutSignal(timeoutMs: number): { signal: AbortSignal; clear: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

let cachedPaidFetch: ((input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) | undefined;
let cachedSignerFingerprint: string | undefined;

function getPaidFetch(privateKey: string) {
  if (cachedPaidFetch && cachedSignerFingerprint === privateKey) return cachedPaidFetch;

  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("Invalid TELEGRAPH_EVM_PRIVATE_KEY: expected a 32-byte 0x-prefixed hex key");
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const client = new x402Client();
  registerExactEvmScheme(client, { signer: account });
  cachedPaidFetch = wrapFetchWithPayment(fetch, client);
  cachedSignerFingerprint = privateKey;
  return cachedPaidFetch;
}

export async function askTelegraph(
  query: string,
  context: Record<string, unknown>,
  options: TelegraphClientOptions = loadTelegraphClientOptions(),
): Promise<TelegraphAskResult> {
  const requestId = crypto.randomUUID();
  const started = Date.now();
  const controllerState = makeTimeoutSignal(options.timeoutMs);
  const url = `${options.engineUrl}/v1/ask`;
  const body = JSON.stringify({ query, context });
  const headers = { "content-type": "application/json", accept: "application/json", "x-veridex-request-id": requestId };

  try {
    const initial = await fetch(url, { method: "POST", headers, body, signal: controllerState.signal });

    if (initial.status !== 402) {
      if (!initial.ok) {
        const detail = (await initial.text().catch(() => "")).slice(0, 500);
        throw new Error(`Telegraph Engine returned HTTP ${initial.status}${detail ? `: ${detail}` : ""}`);
      }
      const response = (await initial.json()) as TelegraphAskResponse;
      return { response, metadata: { requestId, payment: "not_required", statusCode: initial.status, elapsedMs: Date.now() - started } };
    }

    const paymentRequirement = readPaymentRequirement(initial, options.maxPaymentUsdc, options.allowedNetworks);
    if (!options.privateKey) {
      return {
        response: {},
        metadata: {
          requestId,
          payment: "unavailable",
          paymentNetwork: paymentRequirement.network,
          paymentAmountAtomic: paymentRequirement.amountAtomic,
          statusCode: 402,
          elapsedMs: Date.now() - started,
        },
      };
    }

    const paidFetch = getPaidFetch(options.privateKey);
    const paidState = makeTimeoutSignal(options.timeoutMs);
    try {
      const paidResponse = await paidFetch(url, { method: "POST", headers, body, signal: paidState.signal });
      if (!paidResponse.ok) {
        const detail = (await paidResponse.text().catch(() => "")).slice(0, 500);
        throw new Error(`Telegraph paid request returned HTTP ${paidResponse.status}${detail ? `: ${detail}` : ""}`);
      }

      const response = (await paidResponse.json()) as TelegraphAskResponse;
      const proofValue = decodeHeaderValue(paidResponse.headers.get("PAYMENT-RESPONSE"));
      const paymentProof = proofValue && typeof proofValue === "object" ? proofValue as TelegraphPaymentProof : undefined;
      return {
        response,
        metadata: {
          requestId,
          payment: paymentProof?.success === true ? "settled" : "required",
          paymentNetwork: paymentRequirement.network,
          paymentAmountAtomic: paymentRequirement.amountAtomic,
          ...(paymentProof ? { paymentProof } : {}),
          statusCode: paidResponse.status,
          elapsedMs: Date.now() - started,
        },
      };
    } finally {
      paidState.clear();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (controllerState.signal.aborted) throw new Error("Telegraph request timed out");
    throw new Error(message);
  } finally {
    controllerState.clear();
  }
}
