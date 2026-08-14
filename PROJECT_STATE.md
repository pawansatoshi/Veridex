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

**CURRENT PHASE: H1 Miner Critical Path / Phase 01 — EVM Analysis Core + Address-First Miner Bridge**

Repository: `pawansatoshi/Veridex`
Default branch: `main`

## Official H1 dates

- **Aug 13–16, 2026:** foundation sprint
- **Aug 17–31, 2026:** Track 1 Miner + Track 2 Script Author
- **Aug 31–Sep 7, 2026:** Track 3 Applications/Agents
- **Sep 7, 2026:** H1 final evaluation boundary

## Immediate objective

**Competitive Telegraph Miner.**

The H1 Miner answers:

> **What important capabilities does this smart contract expose, and what evidence supports that conclusion?**

H1 capability wedge:

1. ownership / control
2. upgradeability / proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

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
- ground-truth evaluator foundation
- p50/p95/p99 latency primitive and bounded concurrency primitive
- CI dependency audit gate
- dependency-free Miner HTTP bridge with `/health`, `/metrics`, `/analyze`
- public Ethereum RPC fallback
- production static web analyzer
- Vercel routing/build fix so the website is served correctly

## Partially implemented / remaining H1

- real-chain corpus and benchmark run
- exact official Telegraph H1 Intent contract verification and adapter
- protocol request/response tests
- live Miner registration/configuration
- production performance harness/cache/coalescing
- Track 3 real application/agent usage

## H1 classification

### H1_CRITICAL

- address-first detection and EVM wallet/contract gate — **IMPLEMENTED**
- deterministic EVM capability engine — **IMPLEMENTED FOUNDATION**
- evidence hierarchy — **IMPLEMENTED FOUNDATION**
- normalized Miner result — **IMPLEMENTED**
- adversarial/security regression foundation — **IMPLEMENTED FOUNDATION**
- official Telegraph Intent adapter — **BLOCKED until exact official contract is verified**
- real-chain ground-truth corpus — **PARTIAL**
- protocol tests — **MISSING**

### H1_OPERATIONAL

- live Miner deployment — **PARTIAL / deployed API surface**
- real performance benchmark — **PARTIAL**
- safe caching/coalescing — **PARTIAL**
- Track 3 operation — **NOT STARTED**

### POST_H1

- Wallet Safety: approvals, allowances, spender intelligence, permission changes
- Multi-Chain semantic analyzers: Solana, Sui/Move, Aptos, Bitcoin, Cardano, Cosmos and others
- Capability Passport, Watch, Change Intelligence, Policy, Alerts
- PWA/native mobile
- premium UX/3D Contract Core
- agent API/SDK/MCP
- enterprise policy tooling

## Wallet Safety boundary

Wallet Safety is a separate product mode. An EVM EOA should not be passed to contract capability analysis. Future wallet checks may inspect approvals/allowances and route spender contracts through Veridex. Unlimited allowance is a risk signal, not an automatic maliciousness verdict. The system must expose evidence and scan freshness/window and must never claim exhaustive approval coverage from a bounded scan.

## Known risks

1. Address formats overlap across ecosystems; exact chain identity may require chain-specific verification.
2. A four-byte selector is not semantic proof because collisions exist.
3. Verified ABI absence is only conclusive when provider evidence is complete/trustworthy.
4. Mint authorization cannot be inferred from ABI function presence alone.
5. Beacon proxy resolution must not treat a beacon address as implementation code.
6. Telegraph Intent fit remains the primary external H1 dependency.
7. Network latency/provider failures can dominate Miner performance.
8. Vercel core build is intentionally separated from the static site build.
9. Wallet approval discovery requires indexing/log evidence and explicit freshness semantics.

## Tests / verification status

Address detection regression tests now cover EVM, Bitcoin, TRON, Cardano, Solana, Sui-style 32-byte hex and unknown input. Existing bytecode/RPC/proxy/capability regression suites remain in the repository.

The connected GitHub status API does not independently expose a verified CI result for every latest push, so changes are not described as CI-green unless a run is directly verified.

## Latest verified commits

- `5227420e9203909bcdde4250cc2e7240ef1b9df1` — roadmap rebase: address-first + post-H1 wallet/multichain architecture
- `ce0193bf62a7b0319c6fb41e0efe393909d21e63` — multi-chain address architecture
- `1e56c0d49ef6250ad15c4baa3aa430432cceb56c` — wallet safety architecture
- `91fef464e9dd97009048aa33481b7f3dc0ed12c2` — multi-chain address regression tests

## Current production surface

- Production site: `https://veridex-pawansatoshis-projects.vercel.app/`
- Address detection: `POST /detect`
- Contract analysis: `POST /analyze`
- Health: `GET /health`
- Metrics: `GET /metrics`

## Next engineering task

**Verify the exact current Telegraph H1 Intent contract from official protocol sources, implement the smallest protocol adapter and protocol tests, then run the real-chain ground-truth corpus and performance benchmark.**

Do not replace this with broad post-H1 chain analyzers before the H1 Miner is protocol-ready.

## Never claim

A feature is implemented only when the live `main` repository contains the code and relevant tests/CI/deployment evidence support the claim. Documentation alone is not implementation proof.
