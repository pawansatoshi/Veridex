# Veridex — Persistent Project State

> Single source of truth for continuation across chats, agents, IDEs and sessions.

**Last reviewed:** 19 Aug 2026
**Repository:** `pawansatoshi/Veridex`
**Branch:** `main`

## Current phase

**H1 Miner Critical Path / Phase 01 FINAL EXIT AUDIT — EVM Analysis Core + Address-First Detection + Telegraph Miner**

Phase 00 is complete. Phase 01 implementation is substantially complete, but its formal exit gate is not yet closed. The immediate objective is to finish real-chain correctness evidence, remaining regression coverage, Telegraph request/response tests, then freeze and package H1 evidence.

## Mission

Build **Veridex — Verifiable On-Chain Intelligence** as a deterministic-first smart-contract capability intelligence service.

Core promise:

> **Know what a smart contract can do — and know when its powers change.**

Trust principle:

> **No evidence → no certainty.**

## Current H1 wedge

1. Ownership / control
2. Upgradeability / proxy surface
3. Pause capability/state
4. Mint capability/authority where evidence permits

Do not expand this capability matrix before these four are reliable in production.

## Current verified state

### Phase 00

**COMPLETE.** Continuity documents, architecture, roadmap, decisions, phase tracking and handoff material are committed.

### Phase 01 implementation

**SUBSTANTIALLY IMPLEMENTED / FINAL EXIT GATE PENDING.**

Implemented/foundation work on `main` includes:

- strict TypeScript/Vitest foundation
- strict EVM address validation
- multi-chain address-format detection
- EVM wallet-vs-contract resolution using `eth_getCode`
- `/detect`, `/analyze`, `/health`, `/metrics`
- non-EVM and EVM-wallet early-stop behavior
- evidence-first architecture
- bounded EVM instruction walker and selector-collision protection
- malformed/truncated bytecode regression coverage
- RPC timeout/retry/circuit breaker/failure classification
- application JSON-RPC revert vs infrastructure failure classification
- verification abstraction and Sourcify provider foundation
- EIP-1967 / legacy proxy handling with contract/code context separation
- ownership, pause and mint capability foundations
- normalized machine-readable Miner result
- Capability Intelligence model
- deterministic Capability Diff primitive
- ground-truth evaluator foundation
- p50/p95/p99 latency instrumentation
- bounded concurrency
- bounded production analysis cache + in-flight request coalescing
- CI dependency audit gate
- public Ethereum RPC fallback
- production Vercel routing/build fix
- reproducible performance benchmark harness
- real Ethereum mainnet ground-truth verification harness foundation
- failure-injection/recovery regression tests
- H1 owner-action runbook
- standalone Miner response matches the production `veridex.miner.v1` envelope, including `capabilityIntelligence`
- production response-schema verification script in CI
- production endpoint contract documented: `POST /analyze`, JSON request, no auth, Ethereum chain normalized to `1`
- Telegraph Miner YAML reconciled against official Telegraph Miner templates

## Telegraph H1 integration — CURRENT REALITY

The previous project-state entries that said registration was pending are now historical and must not be treated as current status.

### Confirmed

- legitimate Telegraph Intent: **`FRAUD_DETECTION`**
- production Miner base URL: `https://veridex-ecru.vercel.app`
- Telegraph-facing endpoint: `POST /analyze`
- public authentication: none
- Miner YAML reconciled to official Telegraph Miner Standard
- Miner registration completed successfully
- current Miner identity: **Miner #1001 / `veridex-contract-risk-miner`**
- payment/x402 path was integrated before registration
- production endpoint has previously returned successful `/health`, `/metrics`, and POST `/analyze` responses

### Current Telegraph operational issue

Telegraph currently shows the registered Miner as **Unranked / 0 Requests**. This must be treated as a **Telegraph-side routing/ranking issue unless new evidence proves otherwise**. Do not modify Veridex architecture merely to chase the displayed ranking state.

The known operational objective is to obtain a genuine Telegraph-routed request and compare it with the direct Veridex API response. Do not fabricate traffic, requests, users, ranking, or demand.

## Hackathon schedule — H1

Current execution schedule:

- **Track 1 — Miners:** 17 Aug–31 Aug 2026
- **Track 2 — Evaluation Scripts:** 17 Aug–31 Aug 2026
- **Track 3 — Applications/Agents:** 31 Aug–7 Sep 2026
- **H1 final operational boundary:** 7 Sep 2026
- winner/announcement timing previously communicated as approximately 19–25 Sep 2026; re-verify official current rules before relying on this range

Registration was allowed before the end of Track 1; Veridex is already registered. Do not confuse registration timing with the engineering/submission deadline.

## H1 execution plan from 19 Aug

### Gate A — Phase 01 final correctness audit

Priority: **NOW**

1. real-chain proxy/non-proxy integration tests
2. curated real-chain ground-truth corpus
3. controlled RPC timeout regression
4. Telegraph request/response contract tests
5. full unit/integration/adversarial test suite
6. typecheck
7. build
8. production smoke verification

### Gate B — H1 performance/reliability evidence

1. p50/p95/p99 end-to-end latency
2. RPC/verification/analysis/serialization timing
3. failure-rate evidence
4. cache effectiveness
5. in-flight duplicate-request coalescing
6. bounded concurrency evidence
7. recovery/failure-injection evidence

Correctness cannot be traded for latency.

### Gate C — Track 1 submission package

Target completion: **28–30 Aug**; final submission no later than **31 Aug**.

Package must include reproducible evidence for:

- deterministic capability correctness
- evidence provenance
- adversarial safety
- real-chain ground truth
- performance/reliability
- live production endpoint
- Miner registration/identity
- legitimate `FRAUD_DETECTION` mapping
- honest limitations and inconclusive behavior

### Gate D — Track 2 optional

A WASM evaluation script is optional/secondary. It must not delay Track 1. Only implement if the official Intent/evaluation contract is confirmed and there is sufficient time after Track 1 correctness is secure.

### Gate E — Track 3 application/agent

Window: **31 Aug–7 Sep**.

If entered, the application must consume live Telegraph Miners and demonstrate real utility. Do not create a self-referential `agent → Veridex → same agent` loop as fake demand. Prefer a multi-Miner decision/selection architecture where appropriate.

## Explicit remaining work

### H1_CRITICAL

- Phase 01 formal exit gate
- real-chain proxy/non-proxy integration tests
- curated real-chain ground-truth corpus with TP/TN/FP/FN/inconclusive accounting
- controlled RPC-timeout regression
- Telegraph request/response tests
- official Telegraph-routed request verification
- final benchmark/performance evidence
- final Track 1 submission/evidence package

### Operational / evidence

- keep live Miner reachable
- capture honest routing/latency/failure evidence
- document Telegraph Unranked/0 Requests state without claiming unsupported causes
- verify official current rules before final submission

## Explicitly NOT current priorities

Do **not** block H1 on:

- final UI redesign
- LLM explanation layer
- broad proprietary risk scoring
- Capability Passport persistence
- Continuous Watch
- Time Machine persistence
- Policy Engine
- alerts/email/webhooks/mobile
- native mobile
- 3D Contract Core
- broad multi-chain semantic analysis
- large capability expansion
- Track 2 WASM before Track 1 correctness

These remain post-H1 or optional work.

## Post-H1 roadmap

### Phase 02 — Proxy-Aware Composition
Broader proxy families, implementation history, beacon composition and richer code/state provenance.

### Phase 03 — Capability Passport
Canonical evolving identity and evidence-backed capability posture.

### Phase 04 — Continuous Watch
Shared observations, adaptive polling and safe change detection.

### Phase 05 — Capability Change Intelligence / Time Machine
Persistent snapshots, historical capability diffs and explanations.

### Phase 06 — Policy Engine
`COMPLIANT / VIOLATION / INCONCLUSIVE` policy outcomes.

### Phase 07 — Alerts
Observation → Diff → Policy → Alert Event → Notification Router.

### Phase 08 — Wallet Safety
Approvals, allowances, spender intelligence and transaction-risk signals.

### Phase 09 — Multi-Chain Semantic Intelligence
Dedicated semantic analyzers beyond the current address-format detection layer.

### Phase 10 — Product Application
Evidence-first web application, localization, accessibility, PWA and account/product surfaces.

### Phase 11 — 3D Contract Core
Blockchain → Contract → Evidence → Intelligence → Change visualization.

### Phase 12 — Agents / SDK / MCP / Enterprise
Agent APIs, SDK/MCP, enterprise policy tooling and broader Telegraph integrations.

### Phase 13 — Native Mobile
Mobile push and native applications.

## Critical invariants

- never invent a Telegraph Intent
- `FRAUD_DETECTION` is the confirmed H1 Intent
- never treat selector presence as semantic proof
- never treat provider failure as a negative contract finding
- never claim unsupported multi-chain semantic analysis
- never fabricate Telegraph traffic, users, rankings, demand or performance
- every correctness bug gets a regression test
- secrets/private keys/seed phrases must never enter chat or GitHub
- official Telegraph documentation/rules/team guidance outrank assumptions
- repository state plus tests/CI/deployment evidence outrank documentation-only claims

## Continuation instruction

When starting a new chat/agent, read this file first, then:

1. `AGENTS.md`
2. `docs/ROADMAP.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DECISIONS.md`
5. `docs/TELEGRAPH-H1-HANDOFF.md`
6. `docs/phases/PHASE-00-CONSTITUTION.md`
7. `docs/phases/PHASE-01-EVM-CORE.md`
8. inspect the actual current `main` tree and recent commits before changing code

**Next single engineering action:** execute the **Phase 01 final exit audit** against the live repository, starting with real-chain integration/ground-truth gaps and Telegraph request/response tests. Do not begin post-H1 feature work until this gate is closed.