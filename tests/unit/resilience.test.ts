import { describe, expect, it, vi } from "vitest";
import { CircuitBreaker, ExternalCallError, withResilience } from "../../src/infra/resilience.js";

describe("resilience", () => {
  const classify = (error: unknown) => error instanceof ExternalCallError ? error.failure : { kind: "provider_failure" as const, message: "unknown", retryable: true };

  it("does not open on application-level reverts", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 10_000 });
    const operation = vi.fn(async () => { throw new ExternalCallError({ kind: "application_revert", message: "execution reverted", retryable: false }); });
    for (let i = 0; i < 4; i += 1) await expect(withResilience(breaker, operation, { timeoutMs: 100, retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 } }, classify)).rejects.toBeInstanceOf(ExternalCallError);
    expect(operation).toHaveBeenCalledTimes(4);
    expect(breaker.isOpen).toBe(false);
  });

  it("opens after repeated infrastructure failures", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 10_000 });
    const operation = vi.fn(async () => { throw new ExternalCallError({ kind: "network_failure", message: "offline", retryable: true }); });
    for (let i = 0; i < 2; i += 1) await expect(withResilience(breaker, operation, { timeoutMs: 100, retry: { maxAttempts: 1, baseDelayMs: 0, maxDelayMs: 0 } }, classify)).rejects.toBeInstanceOf(ExternalCallError);
    expect(breaker.isOpen).toBe(true);
    await expect(withResilience(breaker, operation, { timeoutMs: 100 }, classify)).rejects.toThrow(/Circuit breaker is open/);
    expect(operation).toHaveBeenCalledTimes(2);
  });
});
