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

**CURRENT PHASE: H1 Miner Critical Path / Phase 01 — EVM Analysis Core + Address-First Miner Bridge + Capability Intelligence**

Repository: `pawansatoshi/Veridex`
Default branch: `main`

## Official H1 dates

- **Aug 13–16, 2026:** foundation sprint
- **Aug 17–31, 2026:** Track 1 Miner + Track 2 Script Author
- **Aug 31–Sep 7, 2026:** Track 3 Applications
- **Sep 8–18, 2026:** winner selection
- **Sep 19–25, 2026:** announcement/prizes

## Immediate objective

**Competitive Telegraph Miner.**

The H1 Miner answers:

> **What important capabilities does this smart contract expose, and what evidence supports that conclusion?**

H1 capability wedge:

1. ownership / control
2. upgradeability / proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

Differentiation abstraction:

> **Capability → Evidence → State → Change**

Capability Intelligence and deterministic Capability Diff are implemented foundations; persistent Watch/Passport runtime remains post-H1.

## Address-first product rule

```text
Any address
  -> detect format/family
  -> EVM: resolve wallet vs deployed contract with eth_getCode
  -> supported contract: run Veridex intelligence
  -> non-EVM/unsupported: explain detected family and stop unsupported analysis
  -> unknown: do not guess
```

The detector currently recognizes EVM, Sui-style 32-byte hex, Aptos/Move-style hex, NEAR implicit, Solana Base58, Bitcoin bech32, TRON Base58, Cardano Shelley and Cosmos SDK bech32 formats. Format recognition is not presented as proof of exact chain where formats overlap.

## Implemented on `main`

- strict TypeScript/Vitest foundation
- strict EVM address validation
- multi-chain address format detection
- EVM wallet-vs-contract resolution using `eth_getCode`
- `/detect` production endpoint
- non-EVM and EVM-wallet early-stop behavior in the web analyzer
- evidence-first multi-chain architecture documentation
- wallet safety post-H1 architecture documentation
- bounded EVM instruction walker and selector-collision protection
- malformed/truncated bytecode regression coverage
- RPC timeout/retry/circuit breaker/failure classification
- expected JSON-RPC application reverts separated from infrastructure failures
- verification abstraction and Sourcify provider
- EIP-1967 proxy/code context separation
- ownership, pause and mint deterministic capability foundations
- normalized analysis orchestrator and machine-readable response
- Capability Intelligence model
- deterministic Capability Diff model
- ground-truth evaluator foundation
- p50/p95/p99 latency primitive and bounded concurrency primitive
- CI dependency audit gate
- dependency-free Miner HTTP bridge with `/health`, `/metrics`, `/analyze`
- public Ethereum RPC fallback
- production static web analyzer
- Vercel routing/build fix so the website is served correctly
- H1 execution/submission gate document
- reproducible H1 performance benchmark protocol
- Telegraph rules/protocol reference rebaselined to current official rules

## Remaining H1 gates

### P0 — protocol

- exact supported H1 Intent contract: **BLOCKED until verified from official protocol/H1 source**
- protocol request/response tests: **BLOCKED by exact contract**
- Miner registration/configuration verification: **PENDING**

The repository intentionally does not invent an Intent. The current accessible official material describes Intent-specific independent leaderboards but does not provide a verified dedicated smart-contract-capability Intent contract. `src/miner/telegraph.ts` therefore remains schema-neutral.

### P0 — quality

- real-chain ground-truth corpus execution: **PENDING**
- benchmark results: **PENDING**
- failure-injection/recovery verification: **PENDING**

### P1 — operations

- production performance harness/cache/coalescing: **PARTIAL**
- live Miner registration: **PENDING**
- Track 3 real application/agent consumption: **NOT STARTED**
- legitimate Track 3 demand: **NOT STARTED**

### P1 — transparency

- meaningful X progress/benchmark/failure-fix campaign: **PLANNED**
- every judging update tagged `@Telegraphprotoc`: **REQUIRED**

## H1 classification

### H1_CRITICAL

- address-first detection and EVM wallet/contract gate — **IMPLEMENTED**
- deterministic EVM capability engine — **IMPLEMENTED FOUNDATION**
- evidence hierarchy — **IMPLEMENTED FOUNDATION**
- Capability Intelligence — **IMPLEMENTED FOUNDATION**
- Capability Diff — **IMPLEMENTED FOUNDATION**
- normalized Miner result — **IMPLEMENTED**
- adversarial/security regression foundation — **IMPLEMENTED FOUNDATION**
- official Telegraph Intent adapter — **BLOCKED on exact official contract**
- real-chain ground-truth benchmark — **PENDING RUN**
- protocol tests — **BLOCKED on exact official contract**

### H1_OPERATIONAL

- live Miner deployment/API — **PARTIAL**
- latency instrumentation — **IMPLEMENTED**
- benchmark evidence — **PENDING RUN**
- safe caching/coalescing — **PARTIAL**
- Track 3 operation — **NOT STARTED**
- X transparency campaign — **PLANNED**

### POST-H1

- Wallet Safety: approvals, allowances, spender intelligence, permission changes
- Multi-Chain semantic analyzers: Solana, Sui/Move, Aptos, Bitcoin, Cardano, Cosmos and others
- Capability Passport
- Continuous Watch
- Capability Change Intelligence persistent runtime
- Policy Engine
- Alerts and notification router
- PWA/native mobile
- premium UX/3D Contract Core
- agent API/SDK/MCP
- enterprise policy tooling

## Wallet Safety boundary

Wallet Safety is a separate product mode. An EVM EOA should not be passed to contract capability analysis. Future wallet checks may inspect approvals/allowances and route spender contracts through Veridex. Unlimited allowance is a risk signal, not an automatic maliciousness verdict. The system must expose evidence and scan freshness/window and must never claim exhaustive approval coverage from a bounded scan.

## Performance rule

Telegraph's official Miner judging is **75% Normalized Performance within the selected Intent + 25% X Engagement & Updates**. There is no separate official "speed percentage". Veridex therefore optimizes correctness, canonical performance, predictable latency and reliability together.

Performance must never be improved by weakening correctness or turning unavailable/inconclusive evidence into negative findings.

## Track 3 rule

Official rules require real Telegraph Miners in Track 3 applications, prohibit mocked/simulated Miner data, require Miners to remain live throughout Track 3, and require legitimate demand. An Intent needs at least 3 active Miners and at least 100 real Track 3 requests to be eligible for global cash prizes. This ecosystem guardrail cannot be satisfied by Veridex alone and must not be gamed.

## Known risks

1. Address formats overlap across ecosystems; exact chain identity may require chain-specific verification.
2. A four-byte selector is not semantic proof because collisions exist.
3. Verified ABI absence is only conclusive when provider evidence is complete/trustworthy.
4. Mint authorization cannot be inferred from ABI function presence alone.
5. Beacon proxy resolution must not treat a beacon address as implementation code.
6. Exact Telegraph Intent contract is currently the primary H1 blocker.
7. Network latency/provider failures can dominate Miner performance.
8. Vercel core build is intentionally separated from the static site build.
9. Wallet approval discovery requires indexing/log evidence and explicit freshness semantics.
10. Public X engagement must remain authentic; metric gaming can disqualify the submission.

## Tests / verification status

Address detection regression tests cover EVM, Bitcoin, TRON, Cardano, Solana, Sui-style 32-byte hex and unknown input. Existing bytecode/RPC/proxy/capability/metrics/ground-truth regression suites remain in the repository.

The connected GitHub status API does not independently expose a verified CI result for every latest push, so changes are not described as CI-green unless a run is directly verified.

## Latest verified repository changes

- H1 execution/submission gates added
- reproducible performance benchmark protocol added
- Telegraph H1 rules reference corrected with official winner dates and judging guardrails
- capability-intelligence architecture retained as H1 wedge

## Current production surface

- Production site: `https://veridex-pawansatoshis-projects.vercel.app/`
- Address detection: `POST /detect`
- Contract analysis: `POST /analyze`
- Health: `GET /health`
- Metrics: `GET /metrics`

## Next single highest-priority unfinished task

**Obtain/verify the exact current H1 supported Intent request/response/evaluation contract from the official Telegraph protocol/H1 channel, then implement the protocol adapter and protocol regression tests without inventing a schema.**

Immediately after that gate:

1. run real-chain ground-truth corpus
2. run performance benchmark
3. verify deployment and failure recovery
4. register/live-test Miner
5. prepare legitimate Track 3 application consumption
6. execute public X transparency campaign

Do not replace these with broad post-H1 chain analyzers or final UI work.

## Never claim

A feature is implemented only when the live `main` repository contains the code and relevant tests/CI/deployment evidence support the claim. Documentation alone is not implementation proof.
