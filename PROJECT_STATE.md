# Veridex — Persistent Project State

> Single source of truth for continuation across chats, agents, IDEs and sessions.

**Last reviewed:** 20 Aug 2026
**Repository:** `pawansatoshi/Veridex`
**Branch:** `main`

## Current phase

**H1 Miner Critical Path / Phase 01 FINAL EXIT AUDIT — EVM Analysis Core + Address-First Detection + Telegraph Miner**

Phase 00 is complete. Phase 01 implementation is substantially complete and production runtime verification is now actively evidenced, but the formal exit gate is not yet closed.

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

**SUBSTANTIALLY IMPLEMENTED / FINAL EXIT GATE IN PROGRESS.**

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
- real Ethereum mainnet ground-truth verification harness
- failure-injection/recovery regression-test foundations
- H1 owner-action runbook
- standalone Miner response matches the production `veridex.miner.v1` envelope, including `capabilityIntelligence`
- production response-schema verification script
- production endpoint contract: `POST /analyze`, JSON request, no auth, Ethereum chain normalized to `1`
- Telegraph Miner YAML reconciled against official Miner template structure
- real-chain evaluator now emits per-capability TP/TN/FP/FN/inconclusive/unavailable/error metrics

## Telegraph H1 integration — CURRENT REALITY

### Confirmed

- production Miner base URL: `https://veridex-ecru.vercel.app`
- Telegraph-facing endpoint: `POST /analyze`
- public authentication: none
- Miner registration completed successfully
- current Miner identity: **Miner #1001 / `veridex-contract-risk-miner`**
- payment/x402 path was integrated before registration
- production endpoint has returned successful `/health`, `/metrics`, and POST `/analyze` responses

### Current operational issue

Telegraph UI previously showed the registered Miner as **Unranked / 0 Requests**. This remains an external routing/ranking state unless new evidence proves a Veridex defect. Do not fabricate traffic, users, ranking or demand.

### Current protocol gate

Telegraph's current Miner documentation states that canonical Intents are live/on-chain and can change, and explicitly instructs miners to read the live canonical set rather than rely on a static list. Historical team confirmation for `FRAUD_DETECTION` remains part of project history, but current canonical-Intent evidence must be captured before the Phase 01 protocol gate is closed.

Do not substitute an unrelated Intent merely to force ranking or registration.

## Runtime evidence captured 20 Aug 2026

The latest production deployment corresponding to commit `c187291d165d2111a3d53d82469e2a7838279bc2` reached Vercel `READY`.

Observed production evidence:

- `/health`: HTTP 200, `ok: true`, service `veridex-miner`
- `/metrics`: HTTP 200
- Vercel runtime logs: **19 POST `/analyze` requests, all HTTP 200** during the verification window immediately after deployment
- Vercel runtime error aggregation: **no runtime errors** in the selected 24-hour window

The 19-request fingerprint matches the configured H1 verification lane (3 real-chain cases + 15 benchmark requests + 1 production-schema request). This is strong evidence that the production verification lane exercised the live endpoint, but response bodies are not exposed in Vercel runtime logs, so semantic correctness and benchmark values are not claimed from this evidence alone.

## Remaining H1 exit blockers

1. complete unit/integration suite result from GitHub Actions
2. real-chain ground-truth artifact with TP/TN/FP/FN/inconclusive accounting
3. controlled deployed RPC timeout/failure-injection evidence
4. recovery verification after provider outage
5. cold/warm benchmark artifact with p50/p95/p99 values
6. exact current Telegraph canonical Intent/request/response contract verification
7. official Telegraph protocol-path health/readiness and genuine routed-request evidence

## Hackathon schedule — H1

- **Track 1 — Miners:** 17 Aug–31 Aug 2026
- **Track 2 — Evaluation Scripts:** 17 Aug–31 Aug 2026
- **Track 3 — Applications/Agents:** 31 Aug–7 Sep 2026
- **H1 final operational boundary:** 7 Sep 2026

Re-verify official rules immediately before final submission.

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

**Next single engineering action:** close the remaining Phase 01 runtime/protocol evidence blockers. Do not begin post-H1 feature work until this gate is closed.
