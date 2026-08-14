# Phase 01 — EVM Analysis Core

## Objective

Build the deterministic observation layer every future Veridex feature depends on. H1 implementation is strictly prioritized around the competitive Miner path; future product systems remain architectural only.

## H1 exit sequence

```text
runtime/resilience
→ bytecode/evidence
→ verification
→ ownership/proxy
→ pause/mint
→ normalized result/orchestrator
→ ground truth
→ Telegraph adapter
→ live Miner
→ performance
```

## Scope and status

| Area | Phase | Priority | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|
| TypeScript/configuration | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED | none | strict typecheck |
| RPC timeout/retry/circuit | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED | runtime | deterministic failure semantics |
| application-level revert classification | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED | RPC | reverts never trip breaker |
| verification abstraction | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED foundation | resilience | provider states distinct |
| Sourcify v2 verification provider | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | verification abstraction | verified ABI lookup with timeout/rate-limit semantics |
| bytecode validation/walker | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED foundation | validation | instruction boundaries enforced |
| selector collision semantics | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | bytecode | fallback remains inconclusive |
| ownership observation | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED foundation | RPC/evidence | positive/renounced/non-applicable/unavailable |
| EIP-1967 proxy resolution | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED foundation | RPC | code/storage separation |
| broader transparent/UUPS composition | 02 | POST_H1 | MISSING | Phase 01 | reliable pattern classification |
| pause capability | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | evidence | ABI-first control-surface result |
| live paused state | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | RPC | observed/not-applicable/unavailable/error |
| mint capability | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | evidence | ABI-first capability result |
| mint authority | 01 | H1_CRITICAL | PARTIAL | source/access-control evidence | authority never guessed |
| normalized analysis result | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | all checks | deterministic machine-readable contract |
| bounded orchestrator | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | normalized result | bounded end-to-end analysis |
| ground-truth corpus | H1 Eval | H1_CRITICAL | IMPLEMENTED FOUNDATION | orchestrator | TP/TN/FP/FN/inconclusive evaluator |
| latency measurement | H1 Ops | H1_OPERATIONAL | IMPLEMENTED FOUNDATION | orchestrator | bounded p50/p95/p99 measurement |
| bounded concurrency primitive | H1 Ops | H1_OPERATIONAL | IMPLEMENTED FOUNDATION | runtime | explicit concurrency cap |
| Telegraph adapter | H1 Miner | H1_CRITICAL | BLOCKED | official Intent schema/evaluation | exact protocol contract + tests |
| live Miner | H1 Ops | H1_OPERATIONAL | MISSING | adapter | deployable/live |

## Required Test Categories

- [x] RPC revert
- [x] provider failure
- [x] circuit breaker
- [x] bounded configuration
- [x] malformed bytecode
- [x] PUSH-data selector decoy
- [x] verification status/provenance semantics
- [x] verification timeout semantics
- [x] ownership positive/renounced/non-applicable/error cases
- [x] EIP-1967 implementation/beacon/unresolved proxy cases
- [x] pause capability ABI semantics
- [x] paused-state success/revert/provider-failure semantics
- [x] mint capability ABI semantics
- [x] malformed ABI capability input
- [x] bytecode fallback remains inconclusive
- [x] selector collision fallback semantics
- [x] normalized-result orchestration
- [x] ground-truth evaluator
- [x] bounded latency tracker
- [x] bounded concurrency
- [x] Sourcify provider semantics
- [ ] RPC timeout regression with controlled clock/fetch
- [ ] real-chain proxy/non-proxy integration
- [ ] real-chain ground-truth corpus
- [ ] Telegraph request/response tests

## Security requirements

H1 security remains mandatory:

- strict address/ABI/bytecode validation
- bounded parser and network work
- instruction-boundary scanning
- RPC timeout, bounded retry and circuit breaker
- application-level revert classification
- provider failure cannot become a contract finding
- no client-supplied data becomes canonical evidence
- no secrets in client code
- dependency/CI security basics
- adversarial regression tests

## Address semantics

For delegatecall proxies:

```text
contractAddress = proxy/storage context
codeAddress     = implementation/code context
```

Live state such as `paused()` must query `contractAddress`. Code/ABI capability inspection may use `codeAddress`. Beacon addresses are never treated as implementations without actual `implementation()` resolution.

## Evidence hierarchy

```text
Tier 1: verified ABI / verified source evidence
       ↓
Tier 2: verified source / structural analysis where supported
       ↓
Tier 3: instruction-aligned bytecode fallback
```

A selector observed in bytecode is never by itself a conclusive semantic capability claim because selector collisions exist.

## Exit Gate

Phase 01 is complete only when every supported check has deterministic behavior, every fallback is observable, no infrastructure failure becomes a contract finding, strict typecheck passes, the complete unit suite passes, real-chain integration tests exist for network assumptions, and project state/decision records are current.

## Current milestone

**The normalized H1 analysis orchestrator, ground-truth evaluator, latency tracker, bounded concurrency primitive and Sourcify verification provider are now implemented on `main`.** The remaining H1 bridge is real-chain ground truth plus the exact Telegraph Intent adapter, followed by live deployment and performance validation.

## Explicit Non-Goals

Do not implement here:

- UI
- LLM explanation layer
- proprietary risk scoring
- Passport/Watch/Policy persistence
- mobile
- 3D Contract Core
- broader post-H1 capability expansion

Those remain preserved in the product architecture but must not block the H1 Miner.
