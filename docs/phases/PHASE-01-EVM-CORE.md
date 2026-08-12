# Phase 01 — EVM Analysis Core

## Objective

Build the deterministic observation layer that every future Veridex feature depends on.

## Scope

### 1. Runtime foundation

- [ ] TypeScript strictness
- [ ] configuration validation
- [ ] deterministic logging/telemetry abstraction
- [ ] bounded concurrency

### 2. EVM transport

- [ ] JSON-RPC client
- [ ] timeout
- [ ] retry policy
- [ ] circuit breaker
- [ ] application-level RPC revert classification
- [ ] provider failure semantics

### 3. External verification

- [ ] verified ABI/source client abstraction
- [ ] timeout
- [ ] rate-limit handling
- [ ] not-configured vs unverified vs API failure
- [ ] no silent downgrade

### 4. Bytecode

- [ ] strict `0x`/hex/length validation
- [ ] EVM instruction walker
- [ ] PUSH operand handling
- [ ] selector detection fallback
- [ ] regression test for operand false positives
- [ ] regression test for selector collision limitation

### 5. Evidence

- [ ] common evidence model
- [ ] detection method
- [ ] fallback reason
- [ ] fallback detail
- [ ] queried address
- [ ] code address where relevant
- [ ] source provenance
- [ ] structured error provenance

### 6. Ownership

- [ ] owner() observation
- [ ] renounced ownership handling
- [ ] non-Ownable behavior classified as not-applicable
- [ ] proxy delegatecall integration test

### 7. Proxy

- [ ] supported transparent/UUPS patterns
- [ ] implementation resolution
- [ ] beacon detection
- [ ] explicit unresolved beacon implementation state
- [ ] no unverified constants

### 8. Capabilities

- [ ] pause capability
- [ ] live paused state
- [ ] mint capability
- [ ] mint authority
- [ ] ABI-first exact function signature
- [ ] bytecode fallback
- [ ] correct code/storage address separation

## Required Test Categories

- happy path
- expected negative
- malformed input
- external dependency failure
- RPC revert
- timeout
- circuit breaker
- selector collision
- PUSH-data decoy
- proxy/non-proxy
- implementation unavailable
- beacon unresolved

## Exit Gate

Phase 01 is complete only when:

- every supported check has deterministic behavior
- every fallback is observable
- no infrastructure failure becomes a contract finding
- strict typecheck passes
- complete unit suite passes
- integration tests exist for assumptions requiring a real chain
- project state and decision log are updated

## Explicit Non-Goals

Do not implement here:

- Telegraph Miner adapter
- UI
- LLM explanation layer
- proprietary risk scoring
- source AST analysis unless required to prove a current correctness gap

Those belong to later phases.
