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

- [x] verified ABI/source client abstraction
- [x] bounded timeout semantics
- [x] rate-limit metadata preserved
- [x] not-configured vs unverified vs API failure
- [x] no silent downgrade

### 4. Bytecode

- [x] strict `0x`/hex/length validation
- [x] bounded EVM instruction walker
- [x] PUSH operand handling
- [x] PUSH4 selector candidate extraction at instruction boundaries
- [x] regression test for PUSH-data selector false positives
- [ ] regression test for selector collision limitation

### 5. Evidence

- [x] common verification evidence model
- [x] detection/provenance method
- [x] fallback-safe status semantics
- [x] provider detail/error provenance
- [x] queried contract address
- [x] verified ABI/source availability
- [x] rate-limit metadata
- [ ] code address integration where relevant

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
- [x] verification status/provenance semantics
- [x] verification timeout semantics
- [ ] happy path capability checks
- [ ] expected negative capability checks
- [ ] timeout regression with controlled clock/fetch for RPC
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

**Runtime + RPC resilience, structural EVM bytecode foundations, and the verification/evidence foundation are implemented on `main`.**

The next implementation milestone is ownership + minimum proxy semantics, followed by pause/mint capability checks. No UI, Passport, Watch, Policy, mobile or other post-H1 product work is permitted to block this phase.

## Explicit Non-Goals

Do not implement here:

- Telegraph Miner adapter before the core analysis result is deterministic and benchmarked
- UI
- LLM explanation layer
- proprietary risk scoring
- source AST analysis unless required to prove a current correctness gap

Those belong to later phases.
