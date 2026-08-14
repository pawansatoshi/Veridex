# Veridex — Persistent Project State

> Single source of truth for continuation across chats, agents, IDEs, and sessions.
>
> Last reviewed: 2026-08-14

## Mission

Build **Veridex — Verifiable On-Chain Intelligence** into a production-grade, deterministic-first smart-contract intelligence layer that can compete in Telegraph Hackathon 1, serve real applications/agents, and evolve into the full Veridex product.

Core promise:

> **Know what a contract can do — and know when its powers change.**

Core trust principle:

> **No evidence → no certainty.**

## Current phase

**CURRENT PHASE: H1 Miner Critical Path / Phase 01 — EVM Analysis Core**

Repository: `pawansatoshi/Veridex`  
Default branch: `main`

## Official H1 dates

- **Aug 13–16, 2026:** foundation sprint
- **Aug 17–31, 2026:** Track 1 Miner + Track 2 Script Author window
- **Aug 31–Sep 7, 2026:** Track 3 Applications/Agents window
- **Sep 7, 2026:** H1 final evaluation boundary
- **Sep 8–18:** winner selection
- **Sep 19–25:** announcement/prizes

Official rules score Miner Track submissions using 75% Normalized Performance within the chosen Intent and 25% X engagement/updates. Track 3 applications must use real Miners, Miners must remain live through Track 3, and an Intent needs at least 3 active Miners plus 100 real Track 3 requests to qualify for global cash prizes.

## Immediate objective

**Competitive Telegraph Miner.**

The H1 Miner answers:

> **What important capabilities does this smart contract expose, and what evidence supports that conclusion?**

H1 capability wedge:

1. ownership / control
2. upgradeability / proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

## H1 critical pipeline

```text
User/Application → Telegraph Intent → Contract Address → Strict Validation
→ Chain/RPC → Verification Evidence → Proxy/Code Resolution
→ Capability Analysis → Evidence Normalization → Conclusive/Inconclusive
→ Machine-Readable Miner Response → Performance Measurement → Telegraph Miner
```

## Implemented on `main`

- strict TypeScript compiler settings and Vitest foundation
- strict EVM address validation
- shared analysis/result type foundation
- bounded runtime configuration
- RPC timeout, bounded retry, circuit breaker and failure classification
- expected JSON-RPC contract reverts separated from infrastructure failures
- adversarial RPC/circuit regression tests
- bounded EVM instruction walker with correct PUSH operand handling
- instruction-boundary PUSH4 extraction
- malformed/truncated bytecode and PUSH-data selector regression tests
- verification provider abstraction with explicit verified/unverified/not-configured/API-failure/timeout/malformed-response states
- provider-derived ABI retained for deterministic capability analysis
- verification evidence normalization and rate-limit metadata
- deterministic `owner()` observation with active/renounced/not-applicable/unavailable/error outcomes
- EIP-1967 implementation/beacon/admin slot inspection
- beacon implementation resolution with explicit unresolved state
- `contractAddress`/`codeAddress` separation
- adversarial ownership/proxy regression coverage
- pause capability detection from verified ABI
- live `paused()` observation with application-revert vs provider-failure semantics
- mint/safeMint capability detection from verified ABI
- conservative bytecode selector fallback that remains inconclusive
- malformed ABI rejection for capability analysis
- **H1 normalized analysis orchestrator** joining proxy, verification, bytecode, ownership, pause and mint evidence
- normalized capability result with detection method, confidence, conclusive state, fallback reason and provider status
- orchestrator regression tests for verified and unverified paths

## Partially implemented

- runtime telemetry and bounded concurrency
- concrete external verification provider
- broader transparent/UUPS/beacon semantic classification
- real-chain integration corpus
- ground-truth evaluation harness
- official Telegraph Intent adapter and live endpoint
- performance harness/cache/coalescing

## H1_CRITICAL

- normalized machine-readable analysis result/orchestrator — **IMPLEMENTED FOUNDATION**
- ground-truth corpus and evaluation harness
- official Telegraph Intent selection and adapter after exact current request/response/evaluation contract verification
- Telegraph request/response tests
- adversarial selector-collision semantics
- real-chain proxy/non-proxy integration
- security/resource-bound regression coverage

## H1_OPERATIONAL

- live Miner deployment
- latency/failure instrumentation and p50/p95/p99 measurement
- safe caching and duplicate-request coalescing where justified
- operational reliability through Track 3
- real Track 3 application/agent consumption
- transparent X progress and benchmark reporting

## POST_H1

- Phase 2 Proxy-Aware Composition
- Capability Intelligence expansion
- Capability Passport
- Continuous Watch
- Change Intelligence / Time Machine
- Policy Engine
- alert/event router
- Email/Webhook/Mobile
- Web/PWA and premium 3D Contract Core
- native mobile
- Agent API/SDK/MCP and enterprise tooling
- broader Telegraph integrations

## Architecture-only / preserved vision

```text
UNDERSTAND → VERIFY → DISCOVER POWERS → WATCH → CONNECT
```

Future architecture remains:

```text
Telegraph Miner
    → Veridex Intelligence Core
    → Capability Passport / Watch / Policy
    → Web / Mobile / Agents
```

The future hero remains **“Know what a contract can do.”** followed by **“Know when its powers change.”** The 3D Contract Core and five-pillar UX are explicitly post-H1 implementation work.

## Telegraph Intent decision

The current official Telegraph Intent reference lists deterministic on-chain intents such as `ONCHAIN_TX_LOOKUP`, `WALLET_BALANCE_CHECK`, `TOKEN_HOLDER_COUNT`, `TVL_LOOKUP`, and `GAS_PRICE`, but none is semantically identical to contract capability intelligence. The rules state that each Intent has an independent leaderboard, so registering under an unrelated Intent would distort evaluation rather than improve it. Veridex therefore keeps the adapter schema-neutral until the exact supported H1 Intent/evaluation contract is confirmed.

## Blocked until verified

- Telegraph Intent selection until the exact supported H1 request/response/evaluation contract is inspected
- official Telegraph addresses/constants until verified from current official sources
- numerical Veridex scoring before evaluation requirements and ground truth justify it
- any beacon implementation claim without actual resolution
- real Miner deployment until Telegraph registration/configuration requirements and required credentials are available

## Known risks

1. A four-byte selector is not semantic proof because collisions exist.
2. Verified ABI absence is only conclusive when the provider's verification result is complete/trustworthy; provider failures must never become negative findings.
3. Mint authorization cannot be inferred from ABI function presence alone.
4. Beacon proxy resolution must not treat the beacon address as implementation code.
5. Telegraph intent fit is currently the main external dependency for the adapter.
6. Network latency/provider failures can dominate Miner performance.
7. A broad response containing raw ABI data would be too large for a production Miner; the final transport adapter must emit normalized evidence, not the entire provider payload.

## Security baseline

H1 requires strict input validation, bounded parser/network work, RPC timeout/retry/circuit breaker, application-level revert classification, safe malformed ABI/bytecode handling, instruction-boundary scanning, no provider-failure-as-contract-result, no client-supplied data as canonical evidence, no secrets in client code, dependency/CI security basics, and adversarial regression tests.

## Tests

CI has repeatedly verified typecheck and the complete Vitest suite through earlier milestones. The latest normalized-analysis test commit is `f35199801270ff12cfe1fe7d19b65a13523edcf7`; its GitHub Actions run is currently in progress and must be confirmed before this commit is called CI-verified.

## Latest verified commit

`795b1c9c9013c15a19e0b6207a716d7301fd7265` — ownership/proxy gate; CI verified.

## Next engineering task

**Build the H1 ground-truth corpus and evaluation harness**, while finalizing the schema-neutral Telegraph adapter boundary. The corpus must cover positive/negative ownership, pause, mint, proxy, verified/unverified and adversarial selector cases, and must report TP/TN/FP/FN/inconclusive and latency metrics without contaminating production logic.

## H1 exit sequence

```text
normalized result/orchestrator
→ ground truth + evaluator
→ official Telegraph Intent adapter
→ live Miner
→ performance optimization
→ Track 3 operation
```

## Never claim

A feature is implemented only when the live `main` repository contains the code and the relevant tests/CI evidence support the claim. Documentation alone is not implementation proof.
