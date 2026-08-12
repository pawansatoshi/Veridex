export type FailureClass =
  | "application_revert"
  | "rpc_application_error"
  | "timeout"
  | "rate_limited"
  | "provider_unavailable"
  | "malformed_response"
  | "circuit_open";

export interface Failure {
  class: FailureClass;
  message: string;
  retryable: boolean;
  countsTowardCircuit: boolean;
}

export type CircuitState = "closed" | "open" | "half_open";

export class CircuitBreaker {
  private state: CircuitState = "closed";
  private failures = 0;
  private openedAt = 0;
  private probeInFlight = false;

  public constructor(
    private readonly threshold: number,
    private readonly resetTimeoutMs: number,
    private readonly now: () => number = Date.now,
  ) {
    if (!Number.isInteger(threshold) || threshold < 1) throw new Error("Circuit threshold must be positive");
    if (!Number.isInteger(resetTimeoutMs) || resetTimeoutMs < 1) throw new Error("Circuit reset timeout must be positive");
  }

  public getState(): CircuitState {
    if (this.state === "open" && this.now() - this.openedAt >= this.resetTimeoutMs) return "half_open";
    return this.state;
  }

  public canRequest(): boolean {
    const state = this.getState();
    if (state === "closed") return true;
    if (state === "open") return false;
    if (this.probeInFlight) return false;
    this.probeInFlight = true;
    return true;
  }

  public recordSuccess(): void {
    this.state = "closed";
    this.failures = 0;
    this.probeInFlight = false;
  }

  public recordFailure(failure: Failure): void {
    this.probeInFlight = false;
    if (!failure.countsTowardCircuit) return;
    this.failures += 1;
    if (this.failures >= this.threshold) {
      this.state = "open";
      this.openedAt = this.now();
    }
  }
}

export function classifyRpcFailure(status: number | undefined, error: unknown): Failure {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  const errorName = error instanceof Error ? error.name : "";

  if (normalized.includes("execution reverted") || normalized.includes("revert")) {
    return { class: "application_revert", message, retryable: false, countsTowardCircuit: false };
  }
  if (errorName === "AbortError" || normalized.includes("timeout") || normalized.includes("timed out")) {
    return { class: "timeout", message, retryable: true, countsTowardCircuit: true };
  }
  if (status === 429) {
    return { class: "rate_limited", message, retryable: true, countsTowardCircuit: true };
  }
  if (status !== undefined && status >= 500) {
    return { class: "provider_unavailable", message, retryable: true, countsTowardCircuit: true };
  }
  return { class: "provider_unavailable", message, retryable: true, countsTowardCircuit: true };
}

export function classifyJsonRpcError(message: string): Failure {
  if (message.toLowerCase().includes("revert")) {
    return { class: "application_revert", message, retryable: false, countsTowardCircuit: false };
  }
  return { class: "rpc_application_error", message, retryable: false, countsTowardCircuit: false };
}
