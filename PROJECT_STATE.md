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
- Telegraph Miner YAML reconciled against the current official Miner standard structure
- real-chain evaluator now emits per-capability TP/TN/FP/FN/inconclusive/unavailable/error metrics
- CI now validates the Miner YAML against the current Telegraph canonical Intent list
- CI now verifies the live Telegraph Miner #1001 integration registry
- preview-only deployed resilience self-test exists on a dedicated non-production branch and is never exposed in production

## Telegraph H1 integration — CURRENT REALITY

### Confirmed

- production Miner base URL: `https://veridex-ecru.vercel.app`
- Telegraph-facing endpoint: `POST /analyze`
- public authentication: none
- Miner registration completed successfully
- current Miner identity: **Miner #1001 / `veridex-contract-risk-miner`**
- payment/x402 path was integrated before registration
- production endpoint has returned successful `/health`, `/metrics`, and POST `/analyze` responses

### Intent reconciliation

Historical Telegraph team confirmation recorded `FRAUD_DETECTION` for Miner #1001. The current official Telegraph Miner YAML standard publishes a canonical Intent list that does **not** include `FRAUD_DETECTION`; it does include `CONTENT_VERIFICATION`, which directly matches Veridex's evidence-backed contract verification function. The repository YAML therefore now declares `CONTENT_VERIFICATION` and removes endpoint-level `intents` in accordance with the current standard.

This is a protocol correctness correction, not an attempt to force ranking. The live registry must confirm that Miner #1001 has synchronized/re-registered with the current canonical configuration before the protocol gate can pass.

### Current operational issue

Telegraph UI previously showed the registered Miner as **Unranked / 0 Requests**. This remains an external routing/ranking state unless new evidence proves a Veridex defect. Do not fabricate traffic, users, ranking or demand.

### Current protocol gate

Telegraph's current Miner documentation defines `semantics.supported_intents` as the canonical Intent declaration and instructs miners to keep the YAML accurate and complete. Current protocol documentation also states that miner registration feeds the routing pool and that routing depends on validator scoring.

## Runtime evidence captured 20 Aug 2026

The latest production deployment corresponding to commit `2f12b53d76ed5d51d1103aa766a8e85b998a52e3` reached Vercel `READY`.

Observed production evidence:

- `/health`: HTTP 200, `ok: true`, service `veridex-miner`
- `/metrics`: HTTP 200
- Vercel runtime logs: repeated successful production `/analyze`, `/health`, and `/metrics` traffic during the verification window
- Vercel runtime error aggregation: no runtime errors in the selected verification window

Production HTTP availability is proven, but semantic correctness and benchmark values are only claimed from machine-readable CI artifacts, not from HTTP status codes alone.

## Remaining H1 exit blockers

1. latest CI run must pass the strengthened current Telegraph YAML/integration gate
2. real-chain ground-truth artifact with TP/TN/FP/FN/inconclusive accounting must be attached to the passing run
3. controlled deployed resilience evidence must be attached; a preview-only self-test is prepared for this purpose while production remains free of diagnostic routes
4. recovery verification after provider outage must be recorded
5. cold/warm benchmark artifact with p50/p95/p99 values must be attached
6. current canonical Telegraph Intent and live Miner registry must agree
7. official Telegraph protocol-path health/readiness and genuine routed-request evidence remain external dependencies; they cannot be fabricated or replaced by direct `/analyze` traffic

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
