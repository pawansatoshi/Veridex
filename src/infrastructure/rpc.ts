import { CircuitBreaker, classifyJsonRpcError, classifyRpcFailure, type Failure } from "./resilience.js";
import type { RuntimeConfig } from "./config.js";

interface JsonRpcSuccess<T> {
  jsonrpc: "2.0";
  id: number;
  result: T;
}

interface JsonRpcError {
  jsonrpc: "2.0";
  id: number;
  error: { code: number; message: string; data?: unknown };
}

export interface RpcFailure {
  kind: "failure";
  failure: Failure;
}

export interface RpcSuccess<T> {
  kind: "success";
  value: T;
}

export type RpcResult<T> = RpcSuccess<T> | RpcFailure;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isJsonRpcResponse(value: unknown): value is JsonRpcSuccess<unknown> | JsonRpcError {
  if (!isRecord(value) || value.jsonrpc !== "2.0" || typeof value.id !== "number") return false;
  return "result" in value || "error" in value;
}

export class JsonRpcClient {
  private readonly circuit: CircuitBreaker;
  private requestId = 0;

  public constructor(
    private readonly config: RuntimeConfig,
    private readonly fetchImpl: typeof fetch = fetch,
    now: () => number = Date.now,
  ) {
    this.circuit = new CircuitBreaker(config.circuitFailureThreshold, config.circuitResetTimeoutMs, now);
  }

  public async call<T>(method: string, params: readonly unknown[] = []): Promise<RpcResult<T>> {
    if (!this.circuit.canRequest()) {
      return {
        kind: "failure",
        failure: {
          class: "circuit_open",
          message: "RPC circuit breaker is open",
          retryable: false,
          countsTowardCircuit: false,
        },
      };
    }

    let lastFailure: Failure | undefined;
    const attempts = this.config.rpcMaxRetries + 1;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.config.rpcTimeoutMs);
        let response: Response;
        try {
          response = await this.fetchImpl(this.config.rpcUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ jsonrpc: "2.0", id: ++this.requestId, method, params }),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (!response.ok) {
          const failure = classifyRpcFailure(response.status, new Error(`RPC HTTP ${response.status}`));
          lastFailure = failure;
          this.circuit.recordFailure(failure);
          if (!failure.retryable || attempt === attempts - 1) return { kind: "failure", failure };
          await this.backoff(attempt);
          continue;
        }

        let payload: unknown;
        try {
          payload = await response.json();
        } catch {
          const failure: Failure = {
            class: "malformed_response",
            message: "RPC response was not valid JSON",
            retryable: true,
            countsTowardCircuit: true,
          };
          lastFailure = failure;
          this.circuit.recordFailure(failure);
          if (attempt === attempts - 1) return { kind: "failure", failure };
          await this.backoff(attempt);
          continue;
        }

        if (!isJsonRpcResponse(payload)) {
          const failure: Failure = {
            class: "malformed_response",
            message: "RPC response did not match JSON-RPC 2.0 shape",
            retryable: true,
            countsTowardCircuit: true,
          };
          lastFailure = failure;
          this.circuit.recordFailure(failure);
          if (attempt === attempts - 1) return { kind: "failure", failure };
          await this.backoff(attempt);
          continue;
        }

        if ("error" in payload) {
          const failure = classifyJsonRpcError(payload.error.message);
          if (payload.error.data !== undefined) failure.message = `${payload.error.message}: ${JSON.stringify(payload.error.data)}`;
          this.circuit.recordFailure(failure);
          return { kind: "failure", failure };
        }

        this.circuit.recordSuccess();
        return { kind: "success", value: payload.result as T };
      } catch (error) {
        const failure = classifyRpcFailure(undefined, error);
        lastFailure = failure;
        this.circuit.recordFailure(failure);
        if (!failure.retryable || attempt === attempts - 1) return { kind: "failure", failure };
        await this.backoff(attempt);
      }
    }

    return {
      kind: "failure",
      failure: lastFailure ?? {
        class: "provider_unavailable",
        message: "RPC request failed without a classified failure",
        retryable: false,
        countsTowardCircuit: true,
      },
    };
  }

  private async backoff(attempt: number): Promise<void> {
    const delayMs = Math.min(this.config.rpcRetryBaseMs * 2 ** attempt, 2_000);
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
  }
}
