# Veridex — Telegraph H1 Current Handoff

> Continuity document for a new chat/agent. Read this before changing code or filling/submitting any Telegraph material.

**Last reviewed:** 20 Aug 2026
**Repository:** `pawansatoshi/Veridex`
**Branch:** `main`
**Current Miner:** #1001 / `veridex-contract-risk-miner`
**H1 window:** Track 1/2: 17–31 Aug 2026; Track 3: 31 Aug–7 Sep 2026

## 1. Current mission

Build **Veridex — Verifiable On-Chain Intelligence** into a winning Telegraph Miner and durable evidence-first smart-contract capability intelligence product.

Core promise:

> Know what a smart contract can do — and know when its powers change.

Trust rule:

> No evidence → no certainty.

H1 remains intentionally narrow:

1. ownership/control
2. upgradeability/proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

Do not expand this matrix before these four are reliable in production.

## 2. Current status — rebaseline

### Completed engineering

- Phase 00 Constitution & Continuity
- deterministic EVM analysis foundation
- address-first detection
- wallet vs contract gate
- evidence-first architecture
- proxy/code-vs-storage semantics
- ownership/pause/mint foundations
- resilience/security baseline
- normalized `veridex.miner.v1` result
- ground-truth evaluator foundation
- latency/concurrency instrumentation
- production API
- Telegraph Miner YAML integration
- Miner #1001 registration flow
- Phase 03 Capability Passport
- Phase 04 Capability Watch
- CI evidence parsing and blocking gates
- live Miner integration verification

### Remaining

- reconcile and verify the live Telegraph registration after restoring the original intent
- real-chain proxy/non-proxy integration evidence
- curated real-chain ground-truth and TP/TN/FP/FN/inconclusive accounting
- controlled RPC timeout and recovery evidence
- Telegraph request/response contract verification
- final p50/p95/p99 and reliability evidence
- final Track 1 submission/evidence package
- current-commit GitHub Actions GREEN exit gate

## 3. Telegraph integration contract

A Telegraph Miner wraps an API/model/dataset/tool. Veridex therefore has two layers:

```text
Veridex deterministic intelligence core
            ↑
Telegraph Miner adapter / API contract
            ↑
Telegraph protocol envelope
```

Do not redesign the Veridex engine around an unverified Intent.

### Current repository Intent

**`FRAUD_DETECTION` is the intended Veridex Miner Intent.** It was the original project configuration and matches the live Explorer's historical Veridex registration state.

The repository Miner YAML must declare:

```yaml
endpoints:
  - path: /analyze
    method: POST
    intents:
      - FRAUD_DETECTION

semantics:
  supported_intents:
    - FRAUD_DETECTION
```

`CONTENT_VERIFICATION` was introduced in a later configuration change and is now removed from the repository's intended Miner configuration. Do not restore it merely to satisfy a CI check; if the live protocol rejects `FRAUD_DETECTION`, verify the current official Telegraph intent registry before making another protocol change.

Do not add `AGENT_TASK` or another unrelated Intent merely for convenience.

### Production API

```text
Base URL: https://veridex-ecru.vercel.app
Method: POST
Path: /analyze
Auth: none
```

Request:

```json
{
  "chain": "1",
  "contractAddress": "0x...",
  "codeAddress": "0x..."
}
```

`codeAddress` is optional. H1 semantic analysis is Ethereum mainnet; chain is normalized to canonical `1`.

### Miner identity

```text
Miner ID: 1001
Slug: veridex-contract-risk-miner
Protocol: generic
Intent: FRAUD_DETECTION
```

### Registration history

- `REG #122` — `FRAUD_DETECTION` — superseded
- `REG #142` — `CONTENT_VERIFICATION` — active at the time of this handoff
- Latest registration transaction recorded in submission docs: `0xd730f6510e3f61069a709a6693d1e8de54a3d7db67b616152131b2d3cb5abbf3`

The repository has now been restored to `FRAUD_DETECTION`. The live Telegraph registry must be re-synchronized through the official edit/re-registration flow. Do not claim live registry alignment until the new active registration is independently verified.

## 4. Current Telegraph operational state

The live Explorer has shown Veridex as Active and has shown recent routed signals. Those signals are network-generated requests; they must not be presented as Veridex-generated demand or as proof of scoring/ranking.

The Explorer previously showed `FRAUD DETECTION` for the superseded registration and `CONTENT_VERIFICATION` for registration #142. This is why the current repository intent and live registry must be reconciled before H1 GREEN.

Next verification target:

```text
updated FRAUD_DETECTION YAML
        ↓
official Telegraph edit/re-registration
        ↓
new active registry entry
        ↓
Telegraph-routed request
        ↓
Miner #1001
        ↓
Veridex /analyze
        ↓
compare with direct API result
        ↓
CI live integration gate
```

Never fabricate requests, traffic, users, ranking, demand or performance.

## 5. Hackathon timing

- **Track 1 — Miners:** 17 Aug–31 Aug 2026
- **Track 2 — Evaluation Scripts:** 17 Aug–31 Aug 2026
- **Track 3 — Applications/Agents:** 31 Aug–7 Sep 2026
- **H1 final operational boundary:** 7 Sep 2026

Re-verify official rules immediately before final submission because dates/criteria can change.

## 6. Execution plan

### Gate A — correctness

1. real-chain proxy/non-proxy tests
2. curated ground-truth corpus
3. RPC timeout/recovery evidence
4. Telegraph request/response tests
5. full tests + typecheck + build
6. production smoke test

### Gate B — performance/reliability

Measure and preserve evidence for:

- p50/p95/p99 end-to-end latency
- RPC latency
- verification latency
- analysis latency
- serialization latency
- error/failure rate
- cache effectiveness
- duplicate-request coalescing
- bounded concurrency
- failure recovery

Correctness cannot be traded for latency.

### Gate C — Track 1 package

Include:

- live Miner identity
- production endpoint
- `FRAUD_DETECTION` Intent evidence
- deterministic correctness evidence
- evidence provenance
- ground-truth results
- adversarial/security results
- benchmark results
- reliability evidence
- reproducible demo
- honest limitations/inconclusive cases

## 7. Track 2 — optional

WASM evaluation is secondary. It must not delay Track 1.

Only proceed if the official evaluation contract is confirmed and Track 1 correctness is secure.

## 8. Track 3 — 31 Aug to 7 Sep

If we enter Track 3, build a real application/agent that consumes live Telegraph Miners. Do not fake demand with an agent calling the same agent. Prefer a genuine multi-Miner consumption/selection/decision workflow when justified. No mocks or fabricated usage.

## 9. Evidence and security invariants

Evidence hierarchy:

```text
Tier 1 — verified ABI / verified source
Tier 2 — supported verified structural evidence
Tier 3 — instruction-boundary bytecode fallback
```

A selector is not semantic proof. Provider failure is never a negative contract finding. Mint authority must not be guessed. Beacon addresses must not be treated as implementations without supported resolution. Every correctness bug gets a regression test.

The preview-only Phase 01 resilience verifier is never enabled in production; production routing remains limited to the documented public API.

## 10. Explicit H1 non-goals

Do not block Track 1 on:

- final UI redesign
- LLM explanation layer
- broad risk scoring
- Capability Passport persistence
- Continuous Watch persistence beyond the H1 contract
- Time Machine persistence
- Policy Engine
- alerts/email/webhooks/mobile
- native mobile
- 3D Contract Core
- broad multi-chain semantic analysis
- large capability expansion

## 11. Continuation rule

For a new chat/agent:

1. read `PROJECT_STATE.md`
2. read `AGENTS.md`
3. read `docs/ROADMAP.md`
4. read `docs/ARCHITECTURE.md`
5. read `docs/DECISIONS.md`
6. read this handoff
7. read the phase documents
8. inspect the actual current `main` tree and recent commits
9. verify live deployment before making production-readiness claims
10. verify live Telegraph registry state before claiming Miner integration is green

**Next single engineering action:** synchronize the live Telegraph registration with the restored `FRAUD_DETECTION` YAML, then run the complete current-commit CI exit gate. Do not begin unrelated post-H1 feature work until this gate is closed.
