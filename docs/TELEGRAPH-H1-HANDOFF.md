# Veridex — Telegraph H1 Current Handoff

> Continuity document for a new chat/agent. Read this before changing code or filling/submitting Telegraph material.

**Last reviewed:** 24 Aug 2026  
**Repository:** `pawansatoshi/Veridex`  
**Branch:** `main`  
**Current Miner:** #1001 / `veridex-contract-risk-miner`  
**Current registration:** #144 / `FRAUD_DETECTION`  
**Production:** `https://veridex-ecru.vercel.app`  
**H1 window:** Track 1/2: 17–31 Aug 2026; Track 3: 31 Aug–7 Sep 2026

## 1. Current mission

Build **Veridex — Verifiable On-Chain Intelligence** into a technically defensible Telegraph Miner and durable evidence-first smart-contract capability intelligence product.

Core promise:

> Know what a smart contract can do — and know when its powers change.

Trust rule:

> No evidence → no certainty.

H1 capability scope remains intentionally narrow:

1. ownership/control
2. upgradeability/proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

## 2. Verified repository state

Completed and present in the repository:

- deterministic EVM analysis foundation
- address-first detection and wallet/contract gate
- evidence hierarchy and instruction-aligned bytecode fallback
- ownership/pause/mint capability foundations
- proxy-aware composition including beacon semantics
- resilient RPC/verification infrastructure
- normalized `veridex.miner.v1` response
- deterministic ground-truth evaluator
- production latency/concurrency instrumentation
- production Miner API
- Telegraph Miner YAML
- Miner `1001` registration flow
- Phase 02 Proxy-Aware Composition
- Phase 03 Capability Passport domain layer
- Phase 04 Continuous Watch domain layer
- blocking CI gates for core, proxy, passport, watch, live integration and evaluation

Historical H1 CI evidence recorded in `PROJECT_STATE.md` is strong, but the available GitHub connector does not expose a fresh blocking Actions run for the newest documentation/code commits. Therefore **do not claim current-commit CI GREEN until a fresh blocking run is independently observed**.

## 3. Current Telegraph contract

The repository's canonical Veridex mapping is:

```text
Miner ID: 1001
Slug: veridex-contract-risk-miner
Intent: FRAUD_DETECTION
Registration: #144
Network: Base Sepolia
Production: https://veridex-ecru.vercel.app
Endpoint: POST /analyze
```

The Miner YAML uses `semantics.supported_intents` and now declares exactly one Intent: `FRAUD_DETECTION`.

The verification scripts were hardened so that both checks require:

1. `FRAUD_DETECTION` is canonical in the live Intent registry.
2. the repository YAML declares exactly `FRAUD_DETECTION`.
3. the live Miner registry advertises exactly `FRAUD_DETECTION`.
4. the live Miner points to the expected production URL.
5. `/analyze` is registered as a POST endpoint.

This closes a prior false-green possibility where the live integration gate could pass with a different canonical Intent.

## 4. Immediate next gates

### Gate A — live Telegraph reconciliation

Verify the live registry independently after registration #144:

```text
FRAUD_DETECTION YAML
        ↓
live canonical Intent registry
        ↓
Miner #1001 live integration
        ↓
POST /analyze
        ↓
compare live Telegraph path with direct production API
```

Do not claim registry alignment if this check is unavailable or fails.

### Gate B — current-commit blocking CI

Run and observe the complete main workflow:

- security audit
- typecheck
- build
- unit tests
- Phase 02 proxy tests
- Phase 03 passport tests
- Phase 04 watch tests
- production health
- YAML validation
- live Telegraph integration
- resilience recovery
- real-chain ground truth
- deterministic evaluation
- production benchmark
- production response schema

### Gate C — Track 1 evidence package

Preserve:

- Miner identity
- registration evidence
- production endpoint
- exact Intent evidence
- real-chain correctness
- TP/TN/FP/FN/inconclusive accounting
- adversarial/security results
- benchmark results
- resilience evidence
- schema verification
- honest limitations

## 5. Security/correctness invariants

- selector presence is not semantic proof
- PUSH payload bytes are not instruction boundaries
- provider failure is never a contract-negative result
- application-level RPC reverts are not transport failures
- beacon addresses are not implementations
- proxy state reads use the proxy storage context
- verification and bytecode provenance remain explicit
- client-supplied hints must never become canonical evidence
- every correctness regression gets a test

## 6. H1 non-goals

Do not block Track 1 on:

- final UI redesign
- LLM explanation layer
- broad risk scoring
- durable Passport persistence
- durable Watch scheduler/store
- Time Machine persistence
- Policy Engine
- alerts/email/webhooks/mobile
- native mobile
- 3D Contract Core
- broad multi-chain semantic analysis
- large capability expansion

## 7. Track 3

Track 3 opens after Track 1/2 close. If pursued, use real Telegraph Miners and real application/agent demand only. Do not simulate demand or call the same Veridex service through a fake agent loop.

## 8. Continuation rule

For a new chat/agent:

1. read `PROJECT_STATE.md`
2. read `AGENTS.md`
3. read `docs/ROADMAP.md`
4. read `docs/ARCHITECTURE.md`
5. read `docs/DECISIONS.md`
6. read this handoff
7. inspect the current `main` tree and recent commits
8. verify the live deployment
9. verify the live Telegraph registry
10. observe a fresh blocking CI run before claiming current-commit GREEN

**Next engineering action:** close the live Telegraph registry + current-commit CI gates. Do not start unrelated post-H1 feature work until those gates are closed.
