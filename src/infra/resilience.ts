export type FailureKind =
  | "timeout"
  | "network_failure"
  | "rate_limited"
  | "provider_failure"
  | "malformed_response"
  | "application_revert";

export interface ExternalFailure {
  kind: FailureKind;
  message: string;
  retryable: boolean;
}

export class ExternalCallError extends Error {
  readonly failure: ExternalFailure;

  constructor(failure: ExternalFailure) {
    super(failure.message);
    this.name = "ExternalCallError";
    this.failure = failure;
  }
}

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  cooldownMs: number;
}

export class CircuitBreaker {
  private consecutiveFailures = 0;
  private openedAt?: number;

  constructor(private readonly options: CircuitBreakerOptions) {
    if (!Number.isInteger(options.failureThreshold) || options.failureThreshold < 1) {
      throw new Error("failureThreshold must be a positive integer");
    }
    if (options.cooldownMs < 1) throw new Error("cooldownMs must be positive");
  }

  get isOpen(): boolean {
    if (this.openedAt === undefined) return false;
    if (Date.now() - this.openedAt >= this.options.cooldownMs) {
      this.openedAt = undefined;
      this.consecutiveFailures = 0;
      return false;
    }
    return true;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = undefined;
  }

  recordInfrastructureFailure(): void {
    if (this.isOpen) return;
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.options.failureThreshold) {
      this.openedAt = Date.now();
    }
  }

  recordApplicationRevert(): void {
    // Contract-level outcomes are valid application semantics and must never
    // contribute to provider-health failure counts.
  }
}

export interface ResilientRequestOptions {
  timeoutMs: number;
  retry?: RetryPolicy;
}

export async function withTimeout<T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error("timeoutMs must be positive");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await operation(controller.signal);
  } catch (error) {
    if (controller.signal.aborted) {
      throw new ExternalCallError({ kind: "timeout", message: `External call timed out after ${timeoutMs}ms`, retryable: true });
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withResilience<T>(
  breaker: CircuitBreaker,
  operation: (signal: AbortSignal) => Promise<T>,
  options: ResilientRequestOptions,
  classifyError: (error: unknown) => ExternalFailure,
): Promise<T> {
  if (breaker.isOpen) {
    throw new ExternalCallError({ kind: "provider_failure", message: "Circuit breaker is open", retryable: true });
  }

  const retry = options.retry ?? { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 };
  const maxAttempts = Math.max(1, Math.min(5, Math.trunc(retry.maxAttempts)));

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const result = await withTimeout(operation, options.timeoutMs);
      breaker.recordSuccess();
      return result;
    } catch (error) {
      const failure = error instanceof ExternalCallError ? error.failure : classifyError(error);
      if (failure.kind === "application_revert") {
        breaker.recordApplicationRevert();
      } else {
        breaker.recordInfrastructureFailure();
      }

      const canRetry = failure.retryable && attempt < maxAttempts && !breaker.isOpen;
      if (!canRetry) throw new ExternalCallError(failure);

      const backoff = Math.min(retry.maxDelayMs, retry.baseDelayMs * 2 ** (attempt - 1));
      if (backoff > 0) await delay(backoff);
    }
  }

  throw new Error("unreachable");
}

export function classifyFetchError(error: unknown): ExternalFailure {
  if (error instanceof ExternalCallError) return error.failure;
  if (error instanceof TypeError) return { kind: "network_failure", message: error.message, retryable: true };
  if (error instanceof Error) return { kind: "provider_failure", message: error.message, retryable: true };
  return { kind: "provider_failure", message: "Unknown external provider failure", retryable: true };
}
