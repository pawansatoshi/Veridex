# Phase 01 — EVM Analysis Core

## Objective

Build the deterministic observation layer that every future Veridex feature depends on.

## Current implementation status

**IN PROGRESS — not complete.**

Implemented in the current branch:

- strict hex/bytecode validation with byte-size bounds
- instruction-aligned EVM walker with PUSH operand handling
- selector fallback limited to actual PUSH4 instructions
- shared timeout/retry/circuit-breaker foundation
- JSON-RPC transport with application-revert separation and QUANTITY block tags
- verification-provider boundary with explicit verification states and preserved failure detail
- evidence provenance and certainty metadata
- bounded runtime configuration validation
- bounded concurrency utility
- deterministic analysis event/telemetry abstraction
- normalized Phase 01 orchestration
- ownership observation and verified-ABI negative handling
- ERC-1967 implementation/beacon observation with explicit unresolved beacon semantics
- pause capability and live paused-state observation
- mint capability detection with authority explicitly left unresolved
- adversarial regression coverage
- synchronized npm lockfile and locked CI

## Scope

### 1. Runtime foundation

- [x] TypeScript strictness
- [x] configuration validation
- [x] deterministic logging/telemetry abstraction
- [x] bounded concurrency

### 2. EVM transport

- [x] JSON-RPC client
- [x] timeout
- [x] retry policy
- [x] circuit breaker
- [x] application-level RPC revert classification
- [x] provider failure semantics
- [x] JSON-RPC QUANTITY block-tag validation

### 3. External verification

- [x] verified ABI/source client abstraction boundary
- [x] timeout
- [x] rate-limit handling
- [x] not-configured vs unverified vs API failure
- [x] no silent downgrade
- [ ] deeper malformed-response corpus
- [ ] verified-source evidence beyond the current ABI boundary where justified

### 4. Bytecode

- [x] strict `0x`/hex/length validation
- [x] EVM instruction walker
- [x] PUSH operand handling
- [x] selector detection fallback
- [x] regression test for operand false positives
- [x] selector collision/ABI hierarchy regression
- [ ] broader malformed-bytecode corpus

### 5. Evidence

- [x] common evidence model
- [x] detection method
- [x] fallback reason
- [x] fallback detail
- [x] queried address
- [x] code address where relevant
- [x] source/provenance field
- [x] structured failure provenance
- [x] conclusive vs inconclusive semantics

### 6. Ownership

- [x] owner() observation
- [x] renounced ownership handling
- [x] non-Ownable behavior classified as not-applicable
- [x] verified ABI negative does not trigger heuristic fallback
- [x] proxy storage/code address separation preserved in checks
- [ ] real-chain delegatecall integration test

### 7. Proxy

- [x] ERC-1967 implementation-slot observation
- [x] ERC-1967 beacon-slot observation
- [x] explicit unresolved beacon implementation state
- [x] no unverified proxy constants; ERC-1967 slots are documented standard values
- [ ] full transparent/UUPS classification
- [ ] beacon.implementation() resolution integration

### 8. Capabilities

- [x] pause capability
- [x] live paused state
- [x] mint capability
- [ ] mint authority evidence model
- [x] ABI-first exact function signature
- [x] bytecode fallback only when stronger ABI evidence is unavailable
- [x] correct code/storage address separation

## Required Test Categories

- [x] happy path
- [x] expected negative
- [x] malformed input
- [x] external dependency failure
- [x] RPC revert
- [x] timeout
- [x] circuit breaker
- [x] selector collision / selector false-positive defenses
- [x] PUSH-data decoy
- [x] proxy/non-proxy ERC-1967 evidence
- [x] implementation unavailable/unresolved beacon semantics
- [x] provenance/fallback reason
- [x] ownership
- [x] pause
- [x] mint
- [x] normalized orchestration
- [ ] real-chain integration corpus
- [ ] broader malformed external-response corpus

## Exit Gate

Phase 01 is complete only when:

- every supported check has deterministic behavior
- every fallback is observable
- no infrastructure failure becomes a contract finding
- strict typecheck passes
- complete unit suite passes
- integration tests exist for assumptions requiring a real chain
- project state and decision log are updated
- remaining provider-health/telemetry measurement and evidence gaps are closed
- Phase 01 security review is complete

## Explicit Non-Goals

Do not implement here:

- Telegraph Miner adapter
- UI
- LLM explanation layer
- proprietary risk scoring
- source AST analysis unless required to prove a current correctness gap
- persistent Watch runtime
- email/webhook notification delivery

Those belong to later phases.
