# Veridex — Persistent Project State

> Single source of truth for continuation across chats, agents, IDEs, and sessions.
>
> Last reviewed: 2026-08-15

## Current phase

**H1 Miner Critical Path / Phase 01 — EVM Analysis Core + Address-First Miner Bridge + Capability Intelligence**

Repository: `pawansatoshi/Veridex`
Default branch: `main`

## Official H1 dates

- Aug 13–16, 2026: foundation sprint
- Aug 17–31, 2026: Track 1 Miner + Track 2 Script Author
- Aug 31–Sep 7, 2026: Track 3 Applications
- Sep 8–18, 2026: winner selection
- Sep 19–25, 2026: announcement/prizes

## Mission

Build **Veridex — Verifiable On-Chain Intelligence** as a deterministic-first smart-contract intelligence layer.

Core promise:

> **Know what a contract can do — and know when its powers change.**

Trust principle:

> **No evidence → no certainty.**

H1 capability wedge:

1. ownership / control
2. upgradeability / proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

Differentiation abstraction:

> **Capability → Evidence → State → Change**

## Address-first rule

```text
Any address
  -> detect format/family
  -> EVM: resolve wallet vs deployed contract with eth_getCode
  -> supported contract: run Veridex intelligence
  -> non-EVM/unsupported: explain detected family and stop unsupported analysis
  -> unknown: do not guess
```

Detector coverage includes EVM, Sui-style 32-byte hex, Aptos/Move-style hex, NEAR implicit, Solana Base58, Bitcoin bech32, TRON Base58, Cardano Shelley and Cosmos SDK bech32 formats. Format recognition is not treated as proof of exact chain where formats overlap.

## Implemented on `main`

- strict TypeScript/Vitest foundation
- strict EVM address validation
- multi-chain address format detection
- EVM wallet-vs-contract resolution using `eth_getCode`
- `/detect`, `/analyze`, `/health`, `/metrics` Miner surfaces
- non-EVM and EVM-wallet early-stop behavior
- evidence-first architecture
- bounded EVM instruction walker and selector-collision protection
- malformed/truncated bytecode regression coverage
- RPC timeout/retry/circuit breaker/failure classification
- application JSON-RPC revert vs infrastructure failure classification
- verification abstraction and Sourcify provider
- EIP-1967 proxy/code context separation
- ownership, pause and mint capability foundations
- normalized machine-readable Miner result
- Capability Intelligence model
- deterministic Capability Diff model
- ground-truth evaluator foundation
- p50/p95/p99 latency instrumentation
- bounded concurrency primitive
- bounded production analysis cache with in-flight request coalescing and cache metrics
- CI dependency audit gate
- public Ethereum RPC fallback
- production static analyzer and Vercel routing/build fix
- H1 execution/submission gate
- reproducible performance benchmark protocol
- `npm run benchmark:miner` production multi-address benchmark harness
- `npm run verify:real-chain` real Ethereum mainnet ground-truth verification harness
- live CI artifact capture for real-chain correctness and production performance
- failure-injection/recovery regression tests at Miner HTTP boundary
- H1 owner action runbook

## H1 quality gates

### P0 protocol

- exact supported H1 Intent contract: **BLOCKED until verified from official protocol/H1 source**
- protocol request/response tests: **BLOCKED by exact contract**
- Miner registration/configuration verification: **PENDING owner/protocol action**

The repository intentionally does not invent an Intent. The current accessible official material lists canonical intents but does not provide a verified dedicated smart-contract-capability Intent contract. `src/miner/telegraph.ts` therefore remains schema-neutral.

### P0 quality

- real-chain ground-truth corpus: **IMPLEMENTED + automated in main CI**
- production benchmark: **IMPLEMENTED + automated in main CI**
- failure-injection/recovery verification: **IMPLEMENTED + automated in main CI**

### P1 operations

- production cache/coalescing: **IMPLEMENTED**
- live Miner registration: **PENDING owner/protocol action**
- Track 3 real application/agent consumption: **NOT STARTED until Track 3 opens**
- legitimate Track 3 demand: **NOT STARTED until Track 3 opens**
- X transparency campaign: **PLANNED**

## H1 classification

### H1_CRITICAL

- address-first detection and wallet/contract gate — **IMPLEMENTED**
- deterministic EVM capability engine — **IMPLEMENTED FOUNDATION**
- evidence hierarchy — **IMPLEMENTED FOUNDATION**
- Capability Intelligence — **IMPLEMENTED FOUNDATION**
- Capability Diff — **IMPLEMENTED FOUNDATION**
- normalized Miner result — **IMPLEMENTED**
- security/adversarial regression foundation — **IMPLEMENTED FOUNDATION**
- official Telegraph adapter — **BLOCKED on exact official contract**
- real-chain ground-truth benchmark — **AUTOMATED**
- protocol tests — **BLOCKED on exact official contract**

### H1_OPERATIONAL

- live Miner deployment/API — **PARTIAL / production endpoint live**
- latency instrumentation — **IMPLEMENTED**
- benchmark harness — **IMPLEMENTED + CI execution**
- benchmark evidence — **CI artifact on main pushes**
- safe caching/coalescing — **IMPLEMENTED**
- Track 3 operation — **NOT STARTED; opens Aug 31**

### POST-H1

- Wallet Safety approvals/allowances/spender intelligence
- Solana/Sui/Aptos/Bitcoin/Cardano/Cosmos semantic analyzers
- Capability Passport
- Continuous Watch
- persistent Capability Change Intelligence
- Policy Engine
- Alerts/notification router
- PWA/native mobile
- premium UX/3D Contract Core
- agent API/SDK/MCP
- enterprise tooling

## Performance rule

Official Miner judging is **75% Normalized Performance within the selected Intent + 25% X Engagement & Updates**. There is no separate official speed percentage. Veridex therefore optimizes correctness, canonical performance, predictable latency and reliability together.

## Track 3 rule

Official rules require real Telegraph Miners, prohibit mocked/simulated Miner data, require Miners to remain live throughout Track 3, and require legitimate demand. An Intent needs at least 3 active Miners and at least 100 real Track 3 requests for global cash-prize eligibility. This ecosystem guardrail cannot be satisfied by Veridex alone and must not be gamed.

## Owner actions required

See `docs/H1-USER-ACTION-RUNBOOK.md`.

Only account/protocol actions require the owner: hackathon registration, official support-channel access, any required Miner wallet/registration, exact Intent confirmation from the official H1 channel, deployment secrets, and legitimate external Track-3 demand.

Never send private keys, seed phrases, API secrets, or Vercel secrets in chat or GitHub.

## Known risks

1. Address formats can overlap across ecosystems.
2. Four-byte selectors are not semantic proof.
3. Verified ABI absence is only conclusive when provider evidence is complete.
4. Mint authorization cannot be inferred from function presence alone.
5. Beacon implementations must not be guessed.
6. Exact Telegraph Intent contract is the primary H1 blocker.
7. Provider latency/failure can dominate Miner performance.
8. Wallet approval discovery requires explicit freshness/indexing semantics.
9. X engagement must remain authentic; metric gaming can disqualify the submission.

## Verification status

Address detection regression tests cover EVM, Bitcoin, TRON, Cardano, Solana, Sui-style 32-byte hex and unknown input. Existing bytecode/RPC/proxy/capability/metrics/ground-truth suites remain in the repository.

The connected GitHub status API does not independently expose a verified CI result for every latest push, so this state file does not call the current commit CI-green until the corresponding workflow run is directly verified.

## Production surface

- `https://veridex-pawansatoshis-projects.vercel.app/`
- `POST /detect`
- `POST /analyze`
- `GET /health`
- `GET /metrics`

## Next single highest-priority unfinished task

**On Aug 17, verify the live Telegraph Intent registry and official H1 request/response/evaluation contract. If the official team provides a matching capability-intelligence Intent, lock it and implement the protocol adapter/tests immediately.**

Then:

1. Miner registration/live test
2. legitimate Track 3 application consumption
3. public X transparency campaign

Do not replace these with broad post-H1 analyzers or final UI work.

## Never claim

A feature is implemented only when the live `main` repository contains the code and relevant tests/CI/deployment evidence support the claim. Documentation alone is not implementation proof.
