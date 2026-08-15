# Veridex — Persistent Project State

> Single source of truth for continuation across chats, agents, IDEs and sessions.

**Last reviewed:** 15 Aug 2026

## Current phase

**H1 Miner Critical Path / Phase 01 — EVM Analysis Core + Address-First Detection + Telegraph Miner Bridge**

Repository: `pawansatoshi/Veridex`  
Default branch: `main`

## Official H1 timeline

- **17 Aug 2026:** Track 1 Miner + Track 2 Script Author open
- **31 Aug 2026:** Track 1 + Track 2 close
- **31 Aug–7 Sep 2026:** Track 3 Applications/Agents
- **7 Sep 2026:** H1 final evaluation boundary

## Mission

Build **Veridex — Verifiable On-Chain Intelligence** as a deterministic-first smart-contract capability intelligence service.

Core promise:

> **Know what a smart contract can do — and know when its powers change.**

Trust principle:

> **No evidence → no certainty.**

## H1 product wedge

1. Ownership / control
2. Upgradeability / proxy surface
3. Pause capability/state
4. Mint capability/authority where evidence permits

## Correct Telegraph model

Telegraph Miners wrap an **API, model, dataset or tool** and provide intelligence to the network. Veridex therefore has two clean layers:

```text
Veridex deterministic Intelligence Core
                    ↑
            Telegraph Miner Adapter
                    ↑
          Telegraph protocol envelope
```

The domain core is not coupled to a guessed Intent.

## Address-first behavior

```text
Any address
  -> detect family
  -> EVM: wallet vs deployed contract
  -> EVM contract: run Veridex analysis
  -> non-EVM: identify family and stop unsupported semantic analysis
  -> unknown: do not guess
```

Recognized formats currently include EVM, Sui-style 32-byte hex, Aptos/Move-style hex, NEAR implicit, Solana Base58, Bitcoin bech32, TRON Base58, Cardano Shelley and Cosmos SDK bech32. Format recognition is not proof of exact chain where formats overlap.

## Implemented on `main`

- strict TypeScript/Vitest foundation
- strict EVM address validation
- multi-chain address-format detection
- EVM wallet-vs-contract resolution using `eth_getCode`
- `/detect`, `/analyze`, `/health`, `/metrics` Miner surfaces
- non-EVM and EVM-wallet early-stop behavior
- evidence-first architecture
- bounded EVM instruction walker and selector-collision protection
- malformed/truncated bytecode regression coverage
- RPC timeout/retry/circuit breaker/failure classification
- application JSON-RPC revert vs infrastructure failure classification
- verification abstraction and Sourcify provider
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
- live CI artifact capture for correctness/performance
- failure-injection/recovery regression tests
- H1 owner-action runbook
- standalone Miner HTTP response now matches the production `veridex.miner.v1` envelope, including `capabilityIntelligence`
- regression coverage for the standalone Miner response envelope
- production response-schema verification script added to CI
- production endpoint contract documented: `POST /analyze`, JSON request, no auth, Ethereum chain normalized to `1`

## H1 classification

### H1_CRITICAL — IMPLEMENTED / FOUNDATION

- address-first detection
- wallet vs contract gate
- deterministic EVM capability engine
- evidence hierarchy
- bytecode safety
- proxy semantics
- ownership / upgradeability / pause / mint foundations
- normalized Miner response
- resilience/security baseline
- ground-truth harness
- performance harness
- production API request/response contract

### H1_CRITICAL — NEXT / PENDING

- verify exact live canonical Telegraph Intent and select only a semantically correct mapping
- connect deployed Veridex API through official Telegraph Miner flow
- generate/validate final Miner YAML/config after Intent is confirmed
- IPFS pin and on-chain Miner registration where required
- real Telegraph request/routing test
- Track 1 submission evidence package

### H1_OPERATIONAL

- live Miner uptime
- real request/performance evidence
- X transparency updates
- Track 3 real application/agent consumption after 31 Aug

### POST_H1

- broader proxy composition
- Capability Passport
- persistent Watch
- Capability Change Intelligence / Time Machine
- Policy Engine
- Alerts / Email / Webhooks / Mobile
- wallet approval/safety intelligence
- semantic multi-chain analyzers
- premium product UX / PWA / 3D Contract Core
- Agent API / SDK / MCP
- enterprise tooling
- native mobile

## Telegraph integration rule

The official supported Intent registry is authoritative. **Do not invent or select an unrelated Intent merely to get a registration through.** If Veridex has no legitimate supported category, obtain an official Telegraph answer before locking the mapping.

Current integration UI exposes:

- Connect API — **H1 Track 1 priority**
- Submit WASM — **Track 2 optional secondary path**
- Consume Intelligence — **Track 3 after Track 1/2**

## Current exact API contract

Production URL: `https://veridex-ecru.vercel.app`

Telegraph-facing endpoint:

```text
POST https://veridex-ecru.vercel.app/analyze
Content-Type: application/json
auth: none
```

Request:

```json
{
  "chain": "1",
  "contractAddress": "0x...",
  "codeAddress": "0x..."
}
```

`codeAddress` is optional. `chain` accepts Ethereum labels but is normalized to canonical chain ID `1`; unsupported chains are rejected.

Success envelope:

```text
schema: veridex.miner.v1
result: normalized analysis
capabilityIntelligence: derived capability map/evidence graph
```

The Vercel production route has been observed receiving POST `/analyze` requests with HTTP 200 on the current production deployment, alongside successful `/health` and `/metrics` requests.

## Performance

Current hackathon rules evaluate Miner performance/ranking plus X progress/engagement and other official criteria. Veridex tracks:

- end-to-end latency
- RPC latency
- verification latency
- analysis latency
- serialization latency
- p50/p95/p99
- failure rate
- cache/coalescing effectiveness
- ground-truth correctness

Never optimize latency by weakening correctness.

## Track 3 constraints

Track 3 requires live Miners and real application usage. No mocked or fabricated demand. If an Intent/category has ecosystem-wide participation thresholds, Veridex must not attempt to game them.

## Known risks / blockers

1. Address formats can overlap across ecosystems.
2. Four-byte selectors are not semantic proof.
3. Verified ABI absence does not automatically prove capability absence.
4. Mint authorization requires authority evidence, not just a `mint` selector.
5. Beacon implementation must not be guessed.
6. **Exact Telegraph canonical Intent mapping remains the principal external integration gate.**
7. Provider latency/failure can dominate Miner performance.
8. X engagement must remain authentic.
9. Vercel currently reports a build-rate-limit status failure for the newest post-31b2c7585b8d1afc1f6cc4881bfb1064ff607419 commits; the production deployment itself remains healthy on the last successful deployment. Do not claim the newest docs/CI-only commits are deployed until Vercel accepts a build.

## Owner actions

See `docs/H1-USER-ACTION-RUNBOOK.md`.

Owner/protocol actions include:

- official hackathon/Telegraph account access
- wallet connection when the official registration flow requires it
- Miner YAML/config submission
- IPFS/on-chain registration transaction
- official support confirmation of Intent mapping when needed
- legitimate external Track 3 application demand

Never send seed phrases, private keys, API secrets or Vercel secrets in chat/GitHub.

## Production surface

- `https://veridex-ecru.vercel.app/`
- `POST /detect`
- `POST /analyze`
- `GET /health`
- `GET /metrics`

## Next single highest-priority task

**Get an official, semantically correct canonical Telegraph Intent for contract-capability intelligence, then generate and validate the final Miner YAML against the live production endpoint.**

After that:

1. official Miner sandbox validation
2. IPFS pin / on-chain registration prerequisites
3. real Telegraph request/routing test
4. Track 1 submission package
5. live performance evidence
6. Track 3 application/agent consumption

## Never claim

A feature is implemented only when the live `main` repository contains the code and relevant tests/CI/deployment evidence support the claim. Documentation alone is not implementation proof.
