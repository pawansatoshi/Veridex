# Veridex Phase 02 — Proxy-Aware Composition

**Status:** IMPLEMENTED / RUNTIME VERIFICATION IN PROGRESS

## Objective

Extend the Phase 01 proxy surface from one-hop resolution to bounded, evidence-preserving proxy composition without weakening the `No evidence → no certainty` rule.

## Scope

1. EIP-1967 implementation, beacon and admin evidence remains the source layer.
2. Legacy ZeppelinOS implementation/admin evidence remains supported.
3. Beacon implementation resolution remains explicit and conservative.
4. Nested proxy/implementation composition is resolved recursively with a hard depth bound.
5. Cycles are detected and never treated as a conclusive terminal implementation.
6. Provider failures remain `unavailable` rather than becoming negative findings.
7. The analyzer uses the terminal effective code address for ABI/bytecode inspection while retaining the root proxy address for live state.
8. The observed implementation lineage is bounded, deterministic and provenance-preserving.

## Semantics

```text
requestedAddress
      ↓
root proxy / contract
      ↓
implementation or beacon resolution
      ↓
next proxy layer (if applicable)
      ↓
terminal implementation code
```

`contractAddress` remains the live storage/state address. `codeAddress` is the terminal code inspection address. A beacon address is never substituted for an implementation address.

## Safety limits

- default composition depth: 4
- absolute depth cap: 8
- repeated address: `cycle_detected`
- depth exhaustion: `max_depth`
- provider failure: `unavailable`
- unresolved beacon: `beacon_unresolved`

A composition that reaches `cycle_detected` or `max_depth` cannot be marked conclusive.

## Verification gates

- unit coverage for nested implementation lineage
- unit coverage for depth bounds
- unit coverage for provider-failure preservation
- existing proxy regression suite remains green
- typecheck/build/test remain green
- deployed Miner remains healthy
- production response schema remains valid
- real-chain corpus and benchmark remain green after composition integration

## Implementation-history boundary

Phase 02 records **observed implementation lineage**, not fabricated historical state. Temporal implementation history requires persisted block-specific observations and belongs to the later Capability Passport / Change Intelligence layers. No historical version is inferred from current RPC state.

## Exit condition

Phase 02 is PASS only when the current `main` commit has a successful CI run covering the full existing Phase 01 gates plus the Phase 02 composition tests, and the matching production deployment is healthy.
