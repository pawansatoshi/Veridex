# Veridex Master Roadmap

## North Star

Build **Veridex — Verifiable On-Chain Intelligence** into a deterministic-first intelligence layer for smart contracts, Telegraph, applications, and autonomous agents.

Core promise:

> **Know what a contract can do — and know when its powers change.**

Core trust principle:

> **No evidence → no certainty.**

## CURRENT: H1 Miner Critical Path

H1 is an execution overlay; it does not delete the original product roadmap.

| Window | Objective | Priority | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|
| Aug 13–16 | foundation + address-first gate | H1_CRITICAL | In progress | core runtime | deterministic core + safety gates |
| Aug 17–31 | Track 1 Miner + Track 2 Script Author | H1_CRITICAL | Upcoming | Miner core | runnable Miner submitted |
| Aug 31–Sep 7 | live Miner + Track 3 applications/agents | H1_OPERATIONAL | Planned | deployed Miner | measured real usage |
| Sep 7 | H1 final boundary | H1_EXIT | Planned | evidence package | evaluation-ready |
| Post-Sep 7 | full Veridex product | POST_H1 | Planned | H1 evidence | staged expansion |

## H1 address-first boundary

```text
User/Application
  -> Address Detection
  -> EVM wallet vs contract resolution when applicable
  -> Chain/RPC
  -> Verification Evidence
  -> Proxy / Code Resolution
  -> Capability Analysis
  -> Evidence Normalization
  -> Miner Response
```

### H1-critical address behavior

| Item | Phase | Priority | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|
| strict EVM validation | Phase 01 | H1_CRITICAL | Implemented | none | adversarial tests |
| multi-chain address format detection | Phase 01 | H1_CRITICAL | Implemented foundation | address module | common ecosystem fixtures |
| EVM wallet vs contract classification | Phase 01 | H1_CRITICAL | Implemented | RPC | `eth_getCode` gate tested |
| non-EVM unsupported-analysis response | Phase 01 | H1_OPERATIONAL | Implemented | detector | no EVM analysis on non-EVM input |
| EVM capability analysis | Phase 01 | H1_CRITICAL | Implemented foundation | RPC/verification | ground truth |
| official Telegraph adapter | H1 Miner | H1_CRITICAL | Blocked pending exact official contract verification | normalized result | protocol tests |

## H1 capability wedge

Only these capabilities are H1 core:

1. ownership / control
2. upgradeability / proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

## Evidence hierarchy

1. verified ABI/source evidence
2. supported verified structural evidence
3. instruction-boundary bytecode fallback

Bytecode fallback is never treated as stronger than verified evidence and selector collisions remain inconclusive.

## Security baseline

Strict address/bytecode validation, bounded parser/network work, RPC timeout/retry/circuit breaker, application-level revert classification, malformed ABI handling, instruction-boundary scanning, explicit provider states, no secrets in client code, dependency/CI security gates, and adversarial regression tests.

## Performance

Measure end-to-end, RPC, verification, analysis and serialization latency; report p50/p95/p99 and failure classes. Use safe caching/coalescing only when freshness semantics are explicit.

## POST-H1 PRODUCT ROADMAP

### Phase 2 — Proxy-Aware Composition
**Priority: POST_H1 | Status: NEXT | Dependency: Phase 1 normalized result**

Exit: correct direct, transparent/UUPS and supported beacon composition without storage/code confusion.

### Phase 3 — Capability Intelligence
**Priority: POST_H1 | Status: PLANNED | Dependency: stable normalized observations**

Exit: versioned machine-readable intelligence object.

### Phase 3.5 — Capability Passport + Persistent Watch
**Priority: POST_H1 | Status: PLANNED | Dependency: normalized intelligence**

Exit: versioned snapshots, observation history and safe change detection.

### Phase 3.7 — Capability Policy Engine
**Priority: POST_H1 | Status: PLANNED | Dependency: Passport/Watch**

Exit: `COMPLIANT`, `VIOLATION`, `INCONCLUSIVE` policy states.

### Phase 4 — Telegraph Integration Expansion
**Priority: POST_H1 | Status: PLANNED | Dependency: official H1 adapter**

Exit: replaceable protocol integrations without domain coupling.

### Phase 5 — Evaluation / Performance Platform
**Priority: H1_OPERATIONAL + POST_H1 | Status: PARTIAL | Dependency: ground truth**

Exit: durable benchmark infrastructure.

### Phase 6 — Production Web Application
**Priority: POST_H1 | Status: PLANNED | Dependency: versioned intelligence API**

Exit: evidence-first web/PWA client.

### Phase 7 — Premium UX / Brand / 3D Contract Core
**Priority: POST_H1 | Status: PLANNED | Dependency: stable product API**

Exit: five-pillar UX with real analysis-state visualization.

### Phase 8 — Wallet Safety
**Priority: POST_H1 | Status: ARCHITECTURE FOUNDATION | Dependency: address-first layer + EVM indexing/evidence**

Scope: approvals, allowances, spender intelligence, permission changes and transaction-risk signals. Unlimited allowance is a risk signal, never an automatic maliciousness verdict. No private-key custody/signing.

### Phase 9 — Multi-Chain Intelligence
**Priority: POST_H1 | Status: ARCHITECTURE FOUNDATION | Dependency: chain-specific adapters**

Scope: Solana, Sui/Move, Aptos, Bitcoin, Cardano, Cosmos and additional ecosystems through dedicated adapters. Detection is already address-first; semantic contract/program analysis is only claimed after an actual adapter is implemented and benchmarked.

### Phase 10 — Mobile / Agent / Enterprise Evolution
**Priority: POST_H1 | Status: PLANNED | Dependency: stable versioned intelligence contract**

Exit: native mobile, agent API/SDK/MCP and enterprise policy tooling.

## Five product pillars

1. **UNDERSTAND** — What is this contract?
2. **VERIFY** — Why should I believe the result?
3. **DISCOVER POWERS** — What can this contract do?
4. **WATCH** — What changes after I leave?
5. **CONNECT** — Can humans, applications, agents and Telegraph consume this intelligence?

H1 focuses on UNDERSTAND + VERIFY + DISCOVER POWERS + CONNECT through the Miner. WATCH remains post-H1.

## Preserved long-term architecture

Capability Passport, Continuous Watch, Capability Change Intelligence, Time Machine, Policy Engine, evidence-backed posture/ranking, channel-agnostic alert router, Email/Webhook/Mobile, Web/PWA, native mobile, premium web, 3D Contract Core, agent API/SDK/MCP, broader Telegraph integrations, enterprise policy tooling, Wallet Safety, and Multi-Chain Intelligence.

## Never-do

- never fabricate Intent schemas, addresses, selectors or evaluation semantics
- never treat RPC reverts as provider outages
- never treat selector scanning as semantic proof
- never claim unsupported chain analysis
- never claim exhaustive wallet approvals from a bounded scan
- never call unlimited allowance proof of maliciousness
- never hide fallback reasons
- never infer capability removal from degraded evidence
- never sacrifice correctness for UI polish
- never fake usage or engagement
- never couple core analysis to Telegraph transport
- never build post-H1 work at the expense of the Miner
