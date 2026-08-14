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
```

## Scope and status

| Area | Phase | Priority | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|
| TypeScript/configuration | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED | none | strict typecheck |
| RPC timeout/retry/circuit | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED | runtime | deterministic failure semantics |
| application-level revert classification | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED | RPC | reverts never trip breaker |
| verification abstraction | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED foundation | resilience | provider states distinct |
| concrete verification provider | 01 | H1_CRITICAL | MISSING | official provider/API | real verified ABI/source evidence |
| bytecode validation/walker | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED foundation | validation | instruction boundaries enforced |
| selector collision semantics | 01 | H1_CRITICAL | MISSING | bytecode | fallback remains inconclusive |
| ownership observation | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED foundation | RPC/evidence | positive/renounced/non-applicable/unavailable |
| EIP-1967 proxy resolution | 01 | H1_CRITICAL | ALREADY_IMPLEMENTED foundation | RPC | code/storage separation |
| broader transparent/UUPS composition | 02 | POST_H1 | MISSING | Phase 01 | reliable pattern classification |
| pause capability | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | evidence | ABI-first control-surface result |
| live paused state | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | RPC | observed/not-applicable/unavailable/error |
| mint capability | 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | evidence | ABI-first capability result |
| mint authority | 01 | H1_CRITICAL | PARTIAL | source/access-control evidence | authority never guessed |
| normalized analysis result | 01 | H1_CRITICAL | MISSING | all checks | deterministic machine-readable contract |
| bounded orchestrator | 01 | H1_CRITICAL | MISSING | normalized result | bounded end-to-end analysis |
| ground-truth corpus | H1 Eval | H1_CRITICAL | MISSING | orchestrator | TP/TN/FP/FN/inconclusive |
| Telegraph adapter | H1 Miner | H1_CRITICAL | BLOCKED | official Intent schema | protocol tests pass |
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
- [ ] selector collision corpus
- [ ] RPC timeout regression with controlled clock/fetch
- [ ] real-chain proxy/non-proxy integration
- [ ] concrete verification provider integration
- [ ] normalized-result contract tests
- [ ] ground-truth evaluation tests
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

**Pause/mint capability foundation is now on `main`.** The next engineering milestone is the normalized H1 analysis orchestrator, followed by ground truth, official Telegraph adapter integration, live Miner and performance work.

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
