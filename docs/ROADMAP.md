# Veridex Master Roadmap

## North Star

Build **Veridex — Verifiable On-Chain Intelligence** into a deterministic-first intelligence layer for smart contracts, Telegraph, applications, and autonomous agents.

Core promise:

> **Know what a contract can do — and know when its powers change.**

Core trust principle:

> **No evidence → no certainty.**

Long-term lifecycle:

```text
Analyze → Verify → Discover Powers → Passport → Watch → Detect Change
→ Explain Change → Policy → Alert → Agent/API → Telegraph
```

## CURRENT: H1 Miner Critical Path

H1 is a temporary execution overlay. It does not delete the original product roadmap.

### Official H1 timeline

| Window | Objective | Priority | Status | Exit criteria |
|---|---|---|---|---|
| Aug 13–16 | Audit, roadmap rebase, Phase 01 foundation | H1_CRITICAL | In progress | core runtime/evidence/security gates green |
| Aug 17–31 | Track 1 Miner + Track 2 Script Author | H1_CRITICAL | Upcoming | real Miner submitted and runnable |
| Aug 31–Sep 7 | Track 3 applications/agents + live Miner | H1_OPERATIONAL | Planned | Miner live, real requests, measured reliability |
| Sep 7 | H1 final boundary | H1_EXIT | Planned | evidence package complete |
| Post-Sep 7 | Full Veridex product | POST_H1 | Planned | staged by measured demand |

Official rules define Track 1/2 as Aug 17–31 and Track 3 as Aug 31–Sep 7. Miner judging is 75% Normalized Performance within the chosen Intent plus 25% X engagement/updates. Track 3 must use real Miners and Miners must remain live through Track 3.

## H1 critical pipeline

```text
User/Application
      ↓
Telegraph Intent
      ↓
Contract Address
      ↓
Strict Validation
      ↓
Chain / RPC
      ↓
Verification Evidence
      ↓
Proxy / Code Address Resolution
      ↓
Capability Analysis
      ↓
Evidence Normalization
      ↓
Conclusive / Inconclusive State
      ↓
Machine-Readable Miner Response
      ↓
Performance Measurement
      ↓
Telegraph Miner
```

## H1 capability wedge

Only these capabilities are H1 core:

1. ownership / control
2. upgradeability / proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

Do not expand into dozens of capabilities before these are reliable and benchmarked.

## H1 classification matrix

| Item | Phase | Priority | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|
| strict address/hex/bytecode validation | Phase 01 | H1_CRITICAL | Implemented | none | adversarial tests |
| RPC timeout/retry/circuit/revert classification | Phase 01 | H1_CRITICAL | Implemented | runtime | reverts never trip breaker |
| verification abstraction/evidence hierarchy | Phase 01 | H1_CRITICAL | Implemented foundation | resilience | provider states distinct |
| Sourcify v2 verification provider | Phase 01 | H1_CRITICAL | Implemented foundation | verification abstraction | verified ABI + failure semantics |
| instruction-aligned bytecode walker | Phase 01 | H1_CRITICAL | Implemented foundation | validation | PUSH-data decoys excluded |
| ownership/control | Phase 01 | H1_CRITICAL | Implemented foundation | RPC/evidence | deterministic positive/negative/inapplicable |
| EIP-1967 proxy/code context | Phase 01 | H1_CRITICAL | Implemented foundation | RPC | contractAddress/codeAddress separated |
| pause capability/state | Phase 01 | H1_CRITICAL | Implemented foundation | evidence/RPC | ABI-first + state tests |
| mint capability/authority | Phase 01 | H1_CRITICAL | Implemented foundation | evidence | capability explicit; authority honest |
| selector-collision semantics | Phase 01 | H1_CRITICAL | Implemented foundation | bytecode | fallback never conclusive |
| normalized analysis result | Phase 01 | H1_CRITICAL | Implemented foundation | all core checks | deterministic schema + tests |
| bounded orchestrator | Phase 01 | H1_CRITICAL | Implemented foundation | normalized result | bounded end-to-end analysis |
| ground-truth corpus/evaluator | Phase 01 | H1_CRITICAL | Implemented foundation | normalized result | TP/TN/FP/FN/inconclusive |
| latency measurement | H1 Operations | H1_OPERATIONAL | Implemented foundation | orchestrator | bounded p50/p95/p99 |
| bounded concurrency | H1 Operations | H1_OPERATIONAL | Implemented foundation | runtime | explicit concurrency cap |
| official Telegraph Intent adapter | H1 Miner | H1_CRITICAL | Blocked pending exact schema/evaluation verification | normalized result | official request/response contract tested |
| live Miner endpoint | H1 Operations | H1_OPERATIONAL | Missing | adapter | deployable/live |
| performance harness | H1 Operations | H1_OPERATIONAL | Partial | live Miner | real p50/p95/p99 + failure metrics |
| Track 3 real usage | H1 Operations | H1_OPERATIONAL | Future | live Miner | real requests and application consumption |
| X transparency/updates | H1 Operations | H1_OPERATIONAL | Planned | real progress | meaningful public evidence |

## AUG 13–16 — Foundation sprint

- repository/source-of-truth audit
- roadmap/state rebase
- resilience and security baseline
- evidence hierarchy
- instruction-correct bytecode analysis
- ownership/proxy
- pause/mint
- normalized orchestrator
- ground-truth evaluator foundation
- latency/concurrency primitives
- verification-provider foundation

## AUG 17 — Track 1 opens

Target: runnable/integration-ready deterministic Miner core; no UI-first detour.

## AUG 17–20 — Telegraph integration hardening

- verify current official Intent and supported request/response contract
- implement adapter boundary
- validate Miner lifecycle/configuration
- error/deadline behavior
- independent protocol tests
- live endpoint path

## AUG 20–24 — Ground truth + correctness

- Ownable/non-Ownable
- pausable/non-pausable
- mintable/non-mintable
- direct/proxy
- verified/unverified
- malformed/adversarial bytecode
- selector collisions
- provider failures/reverts
- false-positive/false-negative/inconclusive analysis
- real-chain corpus

## AUG 24–27 — Performance

- latency instrumentation
- evidence reuse
- safe caching with explicit freshness
- duplicate request coalescing where justified
- bounded concurrency
- provider resilience
- p50/p95/p99 reporting

## AUG 27–30 — Reliability / deployment / demo

- edge cases
- deployment readiness
- operational observability
- documentation
- reproducible Miner demo
- benchmark and transparency material

## AUG 31 — Track 1 submission gate

Submission gate, not engineering stop.

## AUG 31–SEP 7 — Track 3 operational window

- keep Miner live
- accept real requests
- support applications/agents
- measure latency/reliability
- fix critical issues
- publish transparent progress
- collect legitimate utility evidence

## POST-H1 PRODUCT ROADMAP

### Phase 0 — Constitution & continuity
**Status: ALREADY_IMPLEMENTED / COMPLETE**

### Phase 1 — EVM Analysis Core
**Status: H1_CRITICAL / CURRENT**

Exit: deterministic capability observations, normalized result, real-chain ground truth, integration-ready core.

### Phase 2 — Proxy-Aware Composition
**Status: POST_H1 / NEXT**

Dependency: Phase 1 normalized result. Exit: correct direct, transparent/UUPS and supported beacon composition without storage/code confusion.

### Phase 3 — Capability Intelligence
**Status: POST_H1 / PLANNED**

Dependency: stable normalized observations. Exit: versioned machine-readable intelligence object.

### Phase 3.5 — Capability Passport + Persistent Watch
**Status: POST_H1 / PLANNED**

Dependency: normalized intelligence. Exit: versioned snapshots, shared observation and safe change history.

### Phase 3.7 — Capability Policy Engine
**Status: POST_H1 / PLANNED**

Dependency: Passport/Watch. Exit states: `COMPLIANT`, `VIOLATION`, `INCONCLUSIVE`.

### Phase 4 — Telegraph Integration Expansion
**Status: H1 minimal adapter / POST_H1 broader integrations**

Dependency: official H1 adapter and stable core. Exit: replaceable protocol integrations without domain coupling.

### Phase 5 — Evaluation / Performance Platform
**Status: H1 operational requirement + POST_H1 expansion**

Dependency: ground truth. Exit: durable benchmark/evaluation infrastructure.

### Phase 6 — Production Web Application
**Status: POST_H1 / PLANNED**

Dependency: versioned intelligence API. Exit: thin, evidence-first web/PWA client.

### Phase 7 — Premium UX / Brand / 3D Contract Core
**Status: POST_H1 / PLANNED**

Dependency: stable product API. Exit: five-pillar UX with real analysis-state visualization.

### Phase 8 — Hackathon lifecycle
**Status: H1 OPERATIONAL NOW**

Submission, Track 3 operation, measurement and transparent public evidence.

### Phase 9 — Mobile / Agent / Enterprise Evolution
**Status: POST_H1 / PLANNED**

Dependency: stable versioned intelligence contract. Exit: native mobile, agent API/SDK/MCP and enterprise policy tooling.

## Five long-term product pillars

1. **UNDERSTAND** — What is this contract?
2. **VERIFY** — Why should I believe the result?
3. **DISCOVER POWERS** — What can this contract do?
4. **WATCH** — What changes after I leave?
5. **CONNECT** — Can humans, applications, agents and Telegraph consume this intelligence?

H1 focuses on UNDERSTAND + VERIFY + DISCOVER POWERS and CONNECT through the Miner. WATCH remains post-H1.

## Preserved long-term architecture

- Capability Passport
- Continuous Watch
- Capability Change Intelligence
- Capability Time Machine
- Policy Engine
- evidence-backed posture/ranking
- channel-agnostic alert router
- Email / Webhook / Mobile
- Web/PWA
- native mobile
- premium Apple-grade web application
- 3D Contract Core
- agent API/SDK/MCP
- broader Telegraph integrations
- enterprise policy tooling

## Quality gates

Every milestone requires strict typecheck, complete tests, adversarial/regression coverage, no fabricated protocol constants, explicit dependency failure semantics, security review of new trust boundaries, measured network latency, and a state/documentation update.

## Never-do

- never fabricate Intent schemas, addresses, selectors or evaluation semantics
- never treat RPC reverts as provider outages
- never treat selector scanning as stronger than verified ABI/source
- never claim beacon implementation resolution without actual resolution
- never hide fallback reasons
- never infer capability removal from degraded evidence
- never invent scoring before evaluation requirements are known
- never sacrifice correctness for animation
- never fake usage or engagement
- never couple core analysis to Telegraph transport
- never build post-H1 UI/mobile/watch work at the expense of the Miner
