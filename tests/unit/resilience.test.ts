import { describe, expect, it } from "vitest";
import { CircuitBreaker, classifyRpcFailure, runResilienceSelfTest } from "../../src/infrastructure/resilience.js";

describe("RPC failure classification", () => {
  it("does not classify an expected contract revert as infrastructure failure", () => {
    const failure = classifyRpcFailure(undefined, new Error("execution reverted: Ownable: caller is not the owner"));

    expect(failure.class).toBe("application_revert");
    expect(failure.retryable).toBe(false);
    expect(failure.countsTowardCircuit).toBe(false);
  });

  it("classifies timeout as retryable infrastructure failure", () => {
    const failure = classifyRpcFailure(undefined, new Error("The operation was aborted due to timeout"));

    expect(failure.class).toBe("timeout");
    expect(failure.retryable).toBe(true);
    expect(failure.countsTowardCircuit).toBe(true);
  });
});

describe("CircuitBreaker", () => {
  it("opens only after the configured infrastructure failure threshold", () => {
    const circuit = new CircuitBreaker(2, 1_000);
    const failure = { class: "timeout" as const, message: "timeout", retryable: true, countsTowardCircuit: true };

    expect(circuit.canRequest()).toBe(true);
    circuit.recordFailure(failure);
    expect(circuit.getState()).toBe("closed");
    circuit.recordFailure(failure);

    expect(circuit.getState()).toBe("open");
    expect(circuit.canRequest()).toBe(false);
  });

  it("ignores application-level reverts for circuit health", () => {
    const circuit = new CircuitBreaker(1, 1_000);
    const revert = { class: "application_revert" as const, message: "execution reverted", retryable: false, countsTowardCircuit: false };

    expect(circuit.canRequest()).toBe(true);
    circuit.recordFailure(revert);

    expect(circuit.getState()).toBe("closed");
    expect(circuit.canRequest()).toBe(true);
  });
});

describe("deployed resilience self-test", () => {
  it("proves timeout classification, circuit opening, half-open probe and recovery", () => {
    const result = runResilienceSelfTest();

    expect(result.schema).toBe("veridex.phase01.resilience-self-test.v1");
    expect(result.valid).toBe(true);
    expect(result.injectedFailure).toBe("rpc_timeout");
    expect(result.timeoutFailures).toBe(3);
    expect(result.circuitOpened).toBe(true);
    expect(result.halfOpenProbeAllowed).toBe(true);
    expect(result.recovery).toBe(true);
  });
});
