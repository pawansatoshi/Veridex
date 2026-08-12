# Phase 01 — EVM Analysis Core

## Objective

Build the deterministic observation layer that every future Veridex feature depends on. H1 implementation is strictly prioritized around the competitive Miner path; future product systems remain architectural only.

## H1 exit sequence

```text
runtime/resilience
→ bytecode/evidence
→ verification
→ ownership/proxy
→ pause/mint
→ normalized result
→ ground truth
→ Telegraph adapter
→ live Miner
```

## Scope

### 1. Runtime foundation

- [x] TypeScript strictness
- [x] configuration validation
- [ ] deterministic logging/telemetry abstraction
- [ ] bounded concurrency

### 2. EVM transport

- [x] JSON-RPC client
- [x] timeout
- [x] bounded retry policy
- [x] circuit breaker
- [x] application-level RPC revert classification
- [x] provider failure semantics
- [x] malformed JSON-RPC response classification
- [x] JSON-RPC application-error classification separate from infrastructure failure

### 3. External verification

- [ ] verified ABI/source client abstraction
- [ ] timeout
- [ ] rate-limit handling
- [ ] not-configured vs unverified vs API failure
- [ ] no silent downgrade

### 4. Bytecode

- [x] strict `0x`/hex/length validation
- [x] bounded EVM instruction walker
- [x] PUSH operand handling
- [x] PUSH4 selector candidate extraction at instruction boundaries
- [x] regression test for PUSH-data selector false positives
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

- [x] RPC revert
- [x] provider failure
- [x] circuit breaker
- [x] bounded configuration
- [x] malformed bytecode
- [x] PUSH-data selector decoy
- [ ] happy path capability checks
- [ ] expected negative capability checks
- [ ] timeout regression with controlled clock/fetch
- [ ] selector collision semantics
- [ ] proxy/non-proxy
- [ ] implementation unavailable
- [ ] beacon unresolved

## Exit Gate

Phase 01 is complete only when:

- every supported check has deterministic behavior
- every fallback is observable
- no infrastructure failure becomes a contract finding
- strict typecheck passes
- complete unit suite passes
- integration tests exist for assumptions requiring a real chain
- project state and decision log are updated

## Current milestone

**Runtime + RPC resilience and structural EVM bytecode foundations are implemented on `main`.**

The next implementation milestone is the verification/evidence foundation. No UI, Passport, Watch, Policy, mobile or other post-H1 product work is permitted to block this phase.

## Explicit Non-Goals

Do not implement here:

- Telegraph Miner adapter before the core analysis result is deterministic and benchmarked
- UI
- LLM explanation layer
- proprietary risk scoring
- source AST analysis unless required to prove a current correctness gap

Those belong to later phases.
