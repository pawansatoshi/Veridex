# Veridex — Persistent Project State

> Single source of truth for continuation across chats, agents, IDEs and sessions.

**Last reviewed:** 15 Aug 2026

## Current phase

**H1 Miner Critical Path / Phase 01 — EVM Analysis Core + Address-First Detection + Telegraph Miner Bridge**

Repository: `pawansatoshi/Veridex`  
Default branch: `main`

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

## Official Telegraph template reconciliation

The previous `telegraph/miner.yaml` candidate was not fully aligned with the current official Miner Standard. The Telegraph validator returned HTTP 400, and the official `telegraphprotocol/telegraph-examples` repository was inspected directly.

The official templates establish that a Miner YAML uses:

- `version: "1"`
- `kind: miner`
- numeric `id`
- unique lowercase `slug`
- `protocol: generic` for normal HTTP APIs; `bittensor` is for subnet miners
- `name`, `description`, `base_url`
- optional `docs`
- `auth.type: none` for keyless public APIs
- optional rate/cache/circuit settings
- endpoint `path`, `external_path`, `method`, `description`, and `intents`
- optional/recommended JSON `input_schema` and `output_schema`
- `semantics.signal_mapping`
- `semantics.supported_intents` for autonomous routing
- optional `on_chain` block

Veridex has now been reconciled to this official structure. The corrected file is `telegraph/miner.yaml`.

Current corrected identity/configuration:

```yaml
version: "1"
kind: miner
id: 1001
slug: veridex-contract-risk-miner
protocol: generic
name: Veridex
base_url: https://veridex-ecru.vercel.app
auth:
  type: none
```

The `/analyze` endpoint declares `FRAUD_DETECTION`, and `semantics.supported_intents` declares the same canonical Intent. No top-level `supported_intents` convenience field is used because the official annotated template places this declaration under `semantics` and endpoint-level `intents`.

The YAML intentionally omits `on_chain`; this is an API-only inference Miner. The floor price remains an on-chain registration parameter.

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
- Telegraph Miner YAML reconciled against the official `telegraphprotocol/telegraph-examples` Miner templates

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
- **legitimate Telegraph Intent confirmed: `FRAUD_DETECTION`**
- **official Miner YAML structure reconciled**

### H1_CRITICAL — NEXT / PENDING

- official Telegraph YAML/import sandbox validation
- connect deployed Veridex API through official Telegraph Miner flow
- IPFS pin and on-chain Miner registration where required
- real Telegraph request/routing test
- Track 1 submission evidence package

## Official Telegraph Intent confirmation

On 15 Aug 2026, Ahmed Ali explicitly confirmed that `FRAUD_DETECTION` is a legitimate high-value use case for Veridex. His confirmation specifically covered parsing contract state and logic such as ownership, mint/pause authority and upgradeability to output verifiable risk/safety signals that agents can rely on.

Therefore Veridex uses:

```text
FRAUD_DETECTION
```

This is not an inferred or convenience mapping; it is an explicit protocol-team semantic confirmation for the Veridex use case.

Ahmed also confirmed that a single Miner endpoint may subscribe to multiple Intents, but Veridex will not add `AGENT_TASK` without a separate concrete product requirement. Track 1 remains intentionally narrow.

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

## Known risks / blockers

1. Address formats can overlap across ecosystems.
2. Four-byte selectors are not semantic proof.
3. Verified ABI absence does not automatically prove capability absence.
4. Mint authorization requires authority evidence, not just a `mint` selector.
5. Beacon implementation must not be guessed.
6. Provider latency/failure can dominate Miner performance.
7. The Telegraph importer previously returned HTTP 400 against the older non-standard YAML; the YAML has now been reconciled to the official template. The next validation run must confirm the official importer accepts it before any registration transaction.

## Owner actions

See `docs/H1-USER-ACTION-RUNBOOK.md`.

Owner/protocol actions include:

- official hackathon/Telegraph account access
- wallet connection when the official registration flow requires it
- Miner YAML/config submission
- IPFS/on-chain registration transaction
- legitimate external Track 3 application demand

Never send seed phrases, private keys, API secrets or Vercel secrets in chat/GitHub.

## Production surface

- `https://veridex-ecru.vercel.app/`
- `POST /detect`
- `POST /analyze`
- `GET /health`
- `GET /metrics`

## Next single highest-priority task

**Re-import the reconciled `telegraph/miner.yaml` into the official Telegraph Miner Registry and run Step 2 sandbox validation. Do not pin/register until the validator returns success.**

After that:

1. IPFS pin / on-chain registration prerequisites
2. Base Sepolia registration
3. real Telegraph request/routing test
4. Track 1 submission package
5. live performance evidence
6. Track 3 application/agent consumption

## Never claim

A feature is implemented only when the live `main` repository contains the code and relevant tests/CI/deployment evidence support the claim. Documentation alone is not implementation proof.
