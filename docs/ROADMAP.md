# Veridex Master Roadmap

## North Star

**Veridex — Verifiable On-Chain Intelligence**: evidence-backed capability intelligence for contracts and addresses, exposed as a deterministic service that applications and agents can consume.

> **Know what a smart contract can do — and know when its powers change.**

> **No evidence → no certainty.**

---

# CURRENT PHASE — H1 MINER CRITICAL PATH

**Current date:** 15 Aug 2026  
**Track 1/2 opens:** 17 Aug 2026  
**Track 1/2 closes:** 31 Aug 2026  
**Track 3:** 31 Aug–7 Sep 2026  
**H1 final boundary:** 7 Sep 2026

The critical correction from the Telegraph integration research is that a **Miner is an API/model/dataset/tool wrapped for Telegraph**, not a requirement to invent a new blockchain-specific Intent. Veridex's deterministic analysis engine is the product; the Telegraph adapter is the distribution/evaluation boundary.

## H1 execution gates

| Window | Phase | Priority | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|
| Aug 15–16 | Freeze H1 scope + integration contract | H1_CRITICAL | ACTIVE | live Veridex API + official Telegraph material | exact request/response path identified; no invented Intent |
| Aug 17–20 | Telegraph Connect API / Miner integration | H1_CRITICAL | READY TO START | official integration flow | Veridex API accepted by Telegraph and testable through the network |
| Aug 20–24 | Ground truth + correctness hardening | H1_CRITICAL | IMPLEMENTED FOUNDATION | Miner adapter | TP/TN/FP/FN + inconclusive report |
| Aug 24–27 | Performance hardening | H1_CRITICAL | IMPLEMENTED FOUNDATION | live Miner traffic | p50/p95/p99, failure rate and cache/coalescing evidence |
| Aug 27–30 | Reliability + submission package | H1_CRITICAL | NEXT | all above | reproducible demo, docs, benchmarks, live endpoint |
| Aug 31 | Track 1 submission gate | H1_EXIT | UPCOMING | live registered Miner | submitted and reachable |
| Aug 31–Sep 7 | Track 3 operational window | H1_OPERATIONAL | FUTURE | registered live Miner | real application/agent consumption; no mocks |
| Sep 7 | H1 final evaluation boundary | H1_EXIT | FUTURE | performance + usage evidence | final evidence package |

---

# H1 MINER BLUEPRINT

```text
Any Address / Miner Request
        ↓
Telegraph request contract
        ↓
Veridex API adapter
        ↓
Address-family detection
        ↓
EVM wallet vs deployed-contract gate
        ↓
RPC + verification evidence
        ↓
Proxy / code-address resolution
        ↓
Ownership / Upgradeability / Pause / Mint
        ↓
Evidence normalization
        ↓
Confidence + Conclusive/Inconclusive state
        ↓
Machine-readable Miner response
        ↓
Telegraph ranking / real requests
```

### H1 capability scope

1. **Ownership / control**
2. **Upgradeability / proxy surface**
3. **Pause capability/state**
4. **Mint capability/authority where evidence permits**

Do not expand the capability matrix before these four are reliable.

### Address-first UX and API rule

```text
input
 → detect address family
 → EVM wallet? explain and stop contract analysis
 → EVM contract? analyze
 → non-EVM known format? identify family and stop unsupported semantic analysis
 → unknown/ambiguous? do not guess
```

Multi-chain format detection is a usability/security gate, **not** a claim that Veridex already semantically analyzes every chain.

---

# H1 CRITICAL WORK ITEMS

| Item | Phase | Priority | Status | Dependency | Exit criteria |
|---|---|---|---|---|---|
| strict EVM validation | Phase 01 | H1_CRITICAL | IMPLEMENTED | none | adversarial tests |
| multi-chain address detection | Phase 01 | H1_CRITICAL | IMPLEMENTED | detector | family fixtures |
| EVM wallet vs contract | Phase 01 | H1_CRITICAL | IMPLEMENTED | RPC | `eth_getCode` gate |
| non-EVM safe stop | Phase 01 | H1_CRITICAL | IMPLEMENTED | detector | no false EVM analysis |
| ownership/control | Phase 01 | H1_CRITICAL | FOUNDATION | RPC + evidence | curated ground truth |
| upgradeability/proxy | Phase 01 | H1_CRITICAL | FOUNDATION | storage/code semantics | proxy corpus |
| pause | Phase 01 | H1_CRITICAL | FOUNDATION | ABI/bytecode | positive/negative corpus |
| mint | Phase 01 | H1_CRITICAL | FOUNDATION | ABI/bytecode | authority-aware corpus |
| evidence hierarchy | Phase 01 | H1_CRITICAL | IMPLEMENTED FOUNDATION | verification + bytecode | provenance preserved |
| normalized Miner result | Phase 01 | H1_CRITICAL | IMPLEMENTED | domain core | stable machine-readable schema |
| resilience | Phase 01 | H1_CRITICAL | IMPLEMENTED | RPC/provider clients | failure classification tests |
| ground-truth evaluator | H1 Quality | H1_CRITICAL | IMPLEMENTED FOUNDATION | corpus | measurable TP/TN/FP/FN |
| production benchmark | H1 Performance | H1_CRITICAL | IMPLEMENTED FOUNDATION | live API | p50/p95/p99 evidence |
| Telegraph Connect API adapter | H1 Integration | H1_CRITICAL | NEXT | exact official integration contract | real Telegraph request succeeds |
| Miner YAML/config | H1 Integration | H1_CRITICAL | PENDING OWNER | Telegraph integration contract | valid config accepted |
| Miner IPFS/on-chain registration | H1 Integration | H1_CRITICAL | PENDING OWNER | YAML/config | registered Miner visible |
| real Telegraph traffic | H1 Operations | H1_CRITICAL | PENDING | registered Miner | non-mocked requests |
| X transparency campaign | H1 Operations | H1_OPERATIONAL | PLANNED | benchmark/demo evidence | authentic progress updates |

---

# TELEGRAPH INTEGRATION STRATEGY

Telegraph's current integration surface shows three distinct paths:

1. **Connect API** — H1 Track 1 priority for Veridex.
2. **Submit WASM** — Track 2 / evaluation-script path; optional for the Veridex H1 submission unless we deliberately add a quality script.
3. **Consume Intelligence** — Track 3 application/agent path after Track 1/2 close.

The supported Intent list must be treated as authoritative. **Never select an unrelated Intent merely because it is available in the UI.** If Veridex's capability-intelligence category has no legitimate supported Intent, obtain an official answer from the Telegraph team before locking the mapping.

The adapter must remain schema-neutral until that contract is verified.

---

# TRACK 2 OPTION — EVALUATION SCRIPT

**Priority:** H1_OPERATIONAL / optional secondary submission.

After the Miner is live, a deterministic WASM evaluation script may be added if Telegraph provides a suitable Intent/category and ground-truth interface. It must evaluate correctness rather than reward superficial selector matching.

Do not let Track 2 work delay Track 1.

---

# TRACK 3 — DEMAND / APPLICATION VALIDATION

Track 3 begins only after Track 1/2 close.

Target flow:

```text
Application / Agent
       ↓
Telegraph
       ↓
Veridex Miner
       ↓
Evidence-backed capability result
       ↓
Agent/application decision
```

No simulated requests. No fabricated usage. Keep the Miner live throughout the window.

---

# EVIDENCE CONTRACT

```text
Tier 1 — verified ABI / verified source
Tier 2 — supported verified structural evidence
Tier 3 — instruction-boundary bytecode fallback
```

Every result preserves:

- requested address
- contract address
- code address when applicable
- chain
- capability
- result
- evidence
- detection method/tier
- verification state
- confidence
- conclusive/inconclusive
- fallback reason
- provider/API status
- observation metadata when available

Provider failure is never converted into a negative contract finding.

---

# SECURITY / CORRECTNESS GATES

- strict address and bytecode validation
- bounded parser work
- EVM instruction-boundary scanning
- selector-collision protection
- malformed bytecode rejection
- malformed ABI handling
- RPC timeout/retry/circuit breaker
- expected application-level revert classification
- provider/API failure classification
- no client-supplied evidence becomes canonical
- no secrets in client code
- dependency/CI security gates
- every correctness bug gets a regression test

---

# POST-H1 PRODUCT ROADMAP

These are preserved and explicitly **must not block the H1 Miner**.

### Phase 2 — Proxy-Aware Composition
**Priority: POST_H1 | Status: NEXT**

Broader proxy families, implementation history, beacon composition and richer code/state provenance.

### Phase 3 — Capability Passport
**Priority: POST_H1 | Status: PLANNED**

Canonical evolving identity and evidence-backed capability posture.

### Phase 4 — Continuous Watch
**Priority: POST_H1 | Status: PLANNED**

Shared observations, adaptive polling and safe change detection.

### Phase 5 — Capability Change Intelligence / Time Machine
**Priority: POST_H1 | Status: FOUNDATION ONLY**

Persistent snapshots, historical capability diffs, implementation changes and explanations.

### Phase 6 — Policy Engine
**Priority: POST_H1 | Status: PLANNED**

`COMPLIANT / VIOLATION / INCONCLUSIVE` policy outcomes.

### Phase 7 — Alerts
**Priority: POST_H1 | Status: PLANNED**

Observation → Diff → Policy → Alert Event → Notification Router → Email/Webhook/Mobile.

### Phase 8 — Wallet Safety
**Priority: POST_H1 | Status: ARCHITECTURE ONLY**

Approvals, allowances, spender intelligence and transaction-risk signals. Unlimited approval is a risk signal, not a maliciousness verdict.

### Phase 9 — Multi-Chain Semantic Intelligence
**Priority: POST_H1 | Status: DETECTION ONLY**

Dedicated semantic analyzers for Solana, Sui/Move, Aptos, Bitcoin, Cardano, Cosmos and additional ecosystems.

### Phase 10 — Product Application
**Priority: POST_H1 | Status: PARTIAL**

Premium evidence-first web application, localization, accessibility, PWA and account/product surfaces.

### Phase 11 — 3D Contract Core
**Priority: POST_H1 | Status: CONCEPT**

Blockchain → Contract → Evidence → Intelligence → Change visualization.

### Phase 12 — Agents / SDK / MCP / Enterprise
**Priority: POST_H1 | Status: PLANNED**

Agent APIs, SDK/MCP, enterprise policy tooling and broader Telegraph integrations.

### Phase 13 — Native Mobile
**Priority: POST_H1 | Status: PLANNED**

Mobile push, native applications and channel-specific security controls.

---

# FIVE PRODUCT PILLARS

1. **UNDERSTAND** — What is this contract/address?
2. **VERIFY** — Why should I believe the result?
3. **DISCOVER POWERS** — What can this contract do?
4. **WATCH** — What changes after I leave?
5. **CONNECT** — Can humans, applications, agents and Telegraph consume this intelligence?

**H1:** UNDERSTAND + VERIFY + DISCOVER POWERS + CONNECT.  
**Post-H1:** WATCH becomes the persistent product layer.

---

# PERFORMANCE PRINCIPLE

The Miner is judged on Telegraph's ranking/performance and other official criteria. Veridex therefore measures:

- end-to-end latency
- RPC latency
- verification latency
- analysis latency
- serialization latency
- error/failure rate
- cache effectiveness
- duplicate-request coalescing
- ground-truth correctness

**Correctness cannot be traded for latency.**

---

# COMMUNICATION STRATEGY

Public narrative:

**Evidence → Engineering → Measurement → Improvement**

Publish meaningful technical progress, benchmark evidence, demos and honest failure/fix notes. Never fabricate traffic, rankings, users, performance or engagement.

---

# NEVER DO

- never invent a Telegraph Intent
- never map Veridex to an unrelated Intent just to submit
- never treat a selector as semantic proof
- never treat provider failure as a contract negative
- never claim unsupported multi-chain semantic analysis
- never fake Track 3 demand
- never let website polish outrank Miner correctness
- never allow post-H1 features to block Track 1
