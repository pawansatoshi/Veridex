# Veridex Master Roadmap

## North Star

**Veridex — Verifiable On-Chain Intelligence**: evidence-backed capability intelligence for contracts, addresses, applications and agents.

> **Know what a contract can do — and know when its powers change.**

> **No evidence → no certainty.**

## CURRENT: H1 Miner Critical Path

| Window | Objective | Priority | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|
| Aug 13–16 | foundation + address-first gate + capability intelligence primitive | H1_CRITICAL | In progress | core runtime | deterministic core + safety gates |
| Aug 17–31 | Track 1 Miner + Track 2 Script Author | H1_CRITICAL | Upcoming | Miner core | runnable Miner submitted |
| Aug 31–Sep 7 | live Miner + Track 3 applications/agents | H1_OPERATIONAL | Planned | deployed Miner | measured real usage |
| Sep 7 | H1 final boundary | H1_EXIT | Planned | evidence package | evaluation-ready |
| Post-Sep 7 | full Veridex product | POST_H1 | Planned | H1 evidence | staged expansion |

## H1 architecture

```text
Any Address
  -> Detect
  -> EVM: wallet vs contract
  -> Supported contract
  -> Verification / RPC / proxy
  -> Capability observations
  -> Evidence normalization
  -> Capability Intelligence
  -> Machine-readable Miner
```

### H1 critical items

| Item | Phase | Priority | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|
| strict EVM validation | Phase 01 | H1_CRITICAL | Implemented | none | adversarial tests |
| multi-chain address detection | Phase 01 | H1_CRITICAL | Implemented foundation | detector | ecosystem fixtures |
| EVM wallet vs contract | Phase 01 | H1_CRITICAL | Implemented | RPC | `eth_getCode` gate |
| non-EVM safe stop | Phase 01 | H1_OPERATIONAL | Implemented | detector | no EVM analysis |
| ownership / control | Phase 01 | H1_CRITICAL | Implemented foundation | RPC | ground truth |
| upgradeability / proxy | Phase 01 | H1_CRITICAL | Implemented foundation | storage semantics | ground truth |
| pause | Phase 01 | H1_CRITICAL | Implemented foundation | ABI/bytecode | ground truth |
| mint | Phase 01 | H1_CRITICAL | Implemented foundation | ABI/bytecode | ground truth |
| evidence-backed Capability Intelligence | Phase 01 | H1_CRITICAL | Implemented foundation | normalized observations | regression tests |
| capability diff primitive | Phase 01 | H1_OPERATIONAL | Implemented foundation | two normalized snapshots | conclusive diff tests |
| official Telegraph adapter | H1 Miner | H1_CRITICAL | Blocked pending exact official contract verification | normalized result | protocol tests |
| real-chain ground truth | H1 | H1_CRITICAL | Partial | live RPC/providers | TP/TN/FP/FN report |

## Capability Intelligence wedge

The H1 wedge is not merely function detection. Each capability is represented as a state plus evidence, detection method, confidence and conclusive flag. The intelligence layer creates a capability map/evidence graph and can compare two normalized observations without turning degraded evidence into a false removal.

Example target:

```text
Contract
  -> control authority
  -> live code / implementation
  -> ownership
  -> upgradeability
  -> pause
  -> mint
  -> evidence
  -> confidence
  -> capability state
```

## Evidence hierarchy

1. verified ABI/source evidence
2. supported verified structural evidence
3. instruction-boundary bytecode fallback

Selector presence is never semantic proof. Unsupported/incomplete evidence stays inconclusive.

## Security baseline

Strict address/bytecode validation, bounded parser/network work, RPC timeout/retry/circuit breaker, application-level revert classification, malformed ABI handling, instruction-boundary scanning, explicit provider states, no secrets in client code, dependency/CI security gates, and adversarial regression tests.

## POST-H1 PRODUCT ROADMAP

### Phase 2 — Capability Passport + Persistent Watch
**Priority: POST_H1 | Status: NEXT**

Persist normalized snapshots, provenance and timestamps; compare future observations safely.

### Phase 2.5 — Capability Change Intelligence
**Priority: POST_H1 | Status: PARTIAL FOUNDATION**

The deterministic diff primitive exists in the H1 core. Post-H1 adds persistent history, implementation/code-change correlation and richer change explanations.

### Phase 3 — Policy Engine
**Priority: POST_H1 | Status: PLANNED**

Map capability states to `COMPLIANT`, `VIOLATION`, `INCONCLUSIVE` policies.

### Phase 4 — Watch / Alerts
**Priority: POST_H1 | Status: PLANNED**

Observation → Capability Diff → Policy → Alert Event → Notification Router → Email/Webhook/Mobile.

### Phase 5 — Wallet Safety
**Priority: POST_H1 | Status: ARCHITECTURE FOUNDATION**

Approvals, allowances, spender intelligence, permission changes and transaction-risk signals. Unlimited allowance is a risk signal, not an automatic maliciousness verdict. Never claim exhaustive approval coverage from bounded evidence.

### Phase 6 — Multi-Chain Intelligence
**Priority: POST_H1 | Status: ARCHITECTURE FOUNDATION**

Dedicated semantic adapters for Solana, Sui/Move, Aptos, Bitcoin, Cardano, Cosmos and other ecosystems. Detection exists before semantic analysis; unsupported chains are never guessed.

### Phase 7 — Production Web / PWA
**Priority: POST_H1 | Status: PARTIAL**

Evidence-first web experience consuming the versioned intelligence API.

### Phase 8 — Premium UX / 3D Contract Core
**Priority: POST_H1 | Status: PLANNED**

Blockchain → Contract → Evidence → Intelligence → Change visualization.

### Phase 9 — Agent / Telegraph Ecosystem
**Priority: POST_H1 | Status: PLANNED**

Stable machine-readable intelligence for applications, agents, SDK/MCP and broader Telegraph integrations.

### Phase 10 — Mobile / Enterprise
**Priority: POST_H1 | Status: PLANNED**

Native mobile, enterprise policy tooling and channel-specific notification experiences.

## Five product pillars

1. **UNDERSTAND** — What is this contract/address?
2. **VERIFY** — Why should I believe the result?
3. **DISCOVER POWERS** — What can this contract do?
4. **WATCH** — What changes after I leave?
5. **CONNECT** — Can humans, applications, agents and Telegraph consume this intelligence?

H1 focuses on UNDERSTAND + VERIFY + DISCOVER POWERS + CONNECT. WATCH remains post-H1 except for the reusable diff primitive.

## Never-do

- never fabricate Intent schemas or evaluation semantics
- never treat RPC reverts as infrastructure outages
- never treat selectors as semantic proof
- never claim unsupported chain analysis
- never claim exhaustive wallet approvals from bounded scans
- never call unlimited allowance proof of maliciousness
- never hide fallback reasons
- never infer capability removal from degraded evidence
- never sacrifice correctness for UI polish
- never fake usage/engagement
- never couple domain intelligence to Telegraph transport
- never let post-H1 features block the H1 Miner
