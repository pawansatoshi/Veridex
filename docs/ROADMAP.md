# Veridex Master Roadmap

## North Star

Build **Veridex — Verifiable On-Chain Intelligence** into a production-grade, deterministic-first intelligence layer for smart contracts, Telegraph, applications, and autonomous agents.

Core promise:

> **Know what a contract can do — and know when its powers change.**

Core trust principle:

> **No evidence → no certainty.**

Veridex is not a generic one-shot scanner. Its long-term lifecycle is:

```text
Analyze → Verify → Discover Powers → Passport → Watch → Detect Change
→ Explain Change → Policy → Alert → Agent/API → Telegraph
```

The integrated moat is evidence-backed Capability Passport + continuous observation + Change Intelligence + policy + alerting, not any isolated feature.

## H1 REBASELINE — CURRENT PRIORITY

The long-term product roadmap remains intact. H1 introduces a temporary execution overlay so the team can prioritize the official Hackathon 1 Miner window without deleting or prematurely implementing post-H1 product work.

### Official H1 timeline

| Window | Objective | Priority |
|---|---|---|
| **Aug 13–16, 2026** | Foundation sprint: audit, rebaseline, Phase 01 runtime/evidence/security | **H1_CRITICAL** |
| **Aug 17–31, 2026** | Track 1 Miner + Track 2 Script Author window; ship and operate real Miner | **H1_CRITICAL** |
| **Aug 31–Sep 7, 2026** | Track 3 applications/agents consume live Miners; maintain reliability and measure real usage | **H1_OPERATIONAL** |
| **Sep 7, 2026** | H1 final boundary | **H1_EXIT** |
| **Post-Sep 7** | Full Veridex product expansion | **POST_H1** |

Official rules say Track 1 and Track 2 run Aug 17–Aug 31, Track 3 runs Aug 31–Sep 7, and Miner judging is 75% Normalized Performance within the chosen Intent plus 25% X engagement/updates. Track 3 applications must use real Miners, and Miners must remain live throughout Track 3. See `docs/TELEGRAPH_REFERENCE.md` and the official rules before protocol-specific implementation.

## CURRENT PHASE: H1 Miner Critical Path

**Phase identity:** Phase 01 — EVM Analysis Core, accelerated and scoped as the H1 Miner foundation.

### H1 objective

Ship a **real, deterministic, measurable, reliable Veridex Miner**. H1 is not the deadline for the complete commercial Veridex product.

### H1 critical pipeline

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

### H1 capability wedge

Only these capabilities are H1 core:

1. ownership / control
2. upgradeability / proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

Do not expand into dozens of capabilities before these are reliable and benchmarked.

### H1 classification

| Work | Classification | Dependency | Exit condition |
|---|---|---|---|
| Strict address/hex/bytecode validation | H1_CRITICAL | none | adversarial tests pass |
| RPC transport + timeout/retry | H1_CRITICAL | runtime | deterministic failure semantics |
| Circuit breaker + revert classification | H1_CRITICAL | RPC | reverts never trip transport breaker |
| Verification provider abstraction | H1_CRITICAL | resilience | configured/unconfigured/unverified/API failure distinct |
| Instruction-aligned bytecode walker | H1_CRITICAL | validation | PUSH-data decoys cannot create findings |
| Evidence/provenance model | H1_CRITICAL | domain types | every finding auditable |
| Ownership check | H1_CRITICAL | RPC/evidence | positive/negative/inapplicable deterministic |
| Pause check | H1_CRITICAL | RPC/evidence | capability + state semantics tested |
| Mint check | H1_CRITICAL | RPC/evidence | capability/authority uncertainty explicit |
| Minimum proxy-aware semantics | H1_CRITICAL | RPC/bytecode | contractAddress/codeAddress never confused |
| Ground-truth corpus | H1_CRITICAL | checks | expected results independently defined |
| Telegraph Intent adapter | H1_CRITICAL | core result | official schema verified and adapter tested |
| Miner deployment/live operation | H1_OPERATIONAL | adapter | endpoint remains live through Track 3 |
| Performance measurement | H1_OPERATIONAL | live Miner | p50/p95/p99 and failure metrics recorded |
| X progress/transparency | H1_OPERATIONAL | real progress | meaningful, non-spam updates |
| Track 3 application/agent validation | H1_OPERATIONAL | live Miner | real requests, no mocked demand |
| Capability Passport | POST_H1 | stable normalized result | versioned persistent snapshot |
| Continuous Watch | POST_H1 | Passport | shared observations/resource budgets |
| Change Intelligence | POST_H1 | Watch + Passport | evidence-backed before/after diff |
| Capability Time Machine | POST_H1 | Change Intelligence | stored observation timeline |
| Policy Engine | POST_H1 | normalized capabilities | COMPLIANT/VIOLATION/INCONCLUSIVE |
| Email/Webhook/Mobile alerts | POST_H1 | policy/events | channel-agnostic notification router |
| Web/PWA | POST_H1 | API/result contract | thin client of intelligence core |
| Premium 3D Contract Core | POST_H1 | product API | semantic, accessible visual layer |
| Native mobile | POST_H1 | versioned API | separate client, same intelligence |
| Agent API/SDK/MCP expansion | POST_H1 | stable intelligence contract | machine-consumable provenance |

## H1 EXECUTION PLAN

### Aug 13–16 — Foundation sprint

- repository/source-of-truth audit
- roadmap/state rebaseline
- strict runtime/test foundation
- resilience abstraction
- RPC transport
- evidence hierarchy
- bytecode correctness
- ownership/pause/mint
- minimum proxy semantics
- security baseline
- adversarial tests

### Aug 17 — Track 1 opens

Target: Veridex Miner is runnable/integration-ready, with the deterministic core and verified Telegraph adapter path prioritized over UI polish.

### Aug 17–20 — Telegraph integration hardening

- verify chosen official Intent
- request/response contract
- Miner configuration/registration
- error/deadline behavior
- live endpoint
- independent protocol tests

### Aug 20–24 — Ground truth + correctness

- curated contract corpus
- positive/negative/inconclusive cases
- proxy cases
- malformed/adversarial fixtures
- false-positive/false-negative analysis

### Aug 24–27 — Performance

- latency instrumentation
- evidence reuse
- safe caching where freshness is explicit
- duplicate request coalescing where justified
- bounded concurrency
- provider resilience

### Aug 27–30 — Reliability / deployment / demo

- edge cases
- deployment readiness
- operational observability
- documentation
- reproducible demo
- public technical progress

### Aug 31 — Track 1 submission gate

Do not treat this as the end of engineering.

### Aug 31–Sep 7 — Track 3 operational window

- keep Miner live
- accept real requests
- support real applications/agents
- measure latency/reliability
- fix critical issues
- publish transparent progress
- collect legitimate evidence of utility

### Sep 7 — H1 final boundary

H1 evaluation boundary. After this, return to the full product roadmap.

## LONG-TERM PRODUCT ROADMAP

### Phase 0 — Constitution & continuity
**Status: COMPLETE**

### Phase 1 — EVM Analysis Core
**Status: H1 CRITICAL / CURRENT**

The existing Phase 01 contract remains the engineering foundation. H1 adds urgency, not weaker correctness requirements.

### Phase 2 — Proxy-Aware Composition
**Status: POST-H1 / NEXT**

Correctly compose direct, transparent/UUPS and supported beacon flows while preserving live proxy storage semantics.

### Phase 3 — Capability Intelligence
**Status: POST-H1 / PLANNED**

Normalize deterministic observations into a machine-readable intelligence object.

### Phase 3.5 — Capability Passport + Persistent Watch
**Status: POST-H1 / PLANNED**

Build versioned Passport snapshots, continuous shared observation, change detection and historical timeline.

### Phase 3.7 — Capability Policy Engine
**Status: POST-H1 / PLANNED — NEW EXPLICIT MILESTONE**

Make policy evaluation a first-class phase rather than an implicit part of alert architecture.

Required states:

- `COMPLIANT`
- `VIOLATION`
- `INCONCLUSIVE`

No premature numerical policy/confidence mathematics.

### Phase 4 — Telegraph Integration
**Status: H1 adapter work / POST-H1 expansion**

The H1 adapter is the minimal protocol boundary. Broader Telegraph integrations remain post-H1.

### Phase 5 — Evaluation / Performance / Ground Truth
**Status: H1 operational requirement + POST-H1 expansion**

H1 requires enough evaluation to prove correctness/performance. The mature evaluation platform remains a continuing phase.

### Phase 6 — Production Web Application
**Status: POST-H1 / PLANNED**

Responsive web/PWA proof surface over the same intelligence API.

### Phase 7 — Premium UX / Brand / 3D Product Experience
**Status: POST-H1 / PLANNED**

Apple-grade calm UX, Contract Core, progressive disclosure and evidence visualization.

### Phase 8 — Hackathon Demo / Submission / Validation
**Status: H1 operational work now; broader lifecycle remains ongoing**

### Phase 9 — Mobile / Agent / Enterprise Evolution
**Status: POST-H1 / PLANNED**

Native mobile, agent APIs/SDKs/MCP, enterprise policy tooling and broader integrations.

## Five long-term product pillars

1. **UNDERSTAND** — What is this contract?
2. **VERIFY** — Why should I believe the result?
3. **DISCOVER POWERS** — What can this contract do?
4. **WATCH** — What changes after I leave?
5. **CONNECT** — Can humans, applications, agents and Telegraph consume this intelligence?

H1 focuses on UNDERSTAND + VERIFY + DISCOVER POWERS and CONNECT through the Miner. WATCH remains post-H1.

## Long-term product architecture preserved

The following remain explicitly planned and must not be deleted because H1 is narrower:

- Capability Passport
- continuous Watch
- Capability Change Intelligence
- Capability Time Machine
- Policy Engine
- live posture/ranking with evidence/calibration requirements
- email/webhook/mobile notification routing
- PWA/native mobile
- Apple-grade web application
- 3D Contract Core
- five-pillar UX
- agent API/SDK/MCP
- broader Telegraph integrations
- enterprise policy tooling

## Quality gates

Every milestone:

- strict typecheck
- complete test suite
- adversarial/regression coverage
- no fabricated blockchain/Telegraph constants
- explicit external dependency failure semantics
- security review of new trust boundaries
- measured latency for network paths
- documentation/state update
- coherent commits; avoid unnecessary micro-commits

## Never-do

- never fabricate official addresses, ABI values, selectors or Intent schemas
- never treat RPC reverts as provider outages
- never treat selector scanning as stronger than verified ABI/source
- never claim beacon implementation resolution without resolving it
- never hide fallback reasons
- never infer capability removal from degraded evidence
- never invent scoring before evaluation requirements are known
- never sacrifice correctness for animation
- never fake usage, engagement or demand
- never couple core analysis to Telegraph transport
- never build post-H1 UI/mobile/watch work at the expense of the H1 Miner critical path
