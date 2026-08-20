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

## 2. Current status — important rebaseline

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
- current official Telegraph Miner YAML structure reconciliation
- Miner registration
- Miner #1001 created/registered
- CI evidence parsing fixed and passing on the previous verification lane
- current Telegraph YAML canonical-Intent validation added to CI
- live Miner integration verification added to CI

### Remaining

The project is now in **Phase 01 FINAL EXIT AUDIT / H1 production evidence**.

Remaining high-priority engineering/evidence work:

- real-chain proxy/non-proxy integration tests
- curated real-chain ground-truth and TP/TN/FP/FN/inconclusive accounting
- controlled RPC timeout and recovery evidence
- Telegraph request/response contract verification
- genuine Telegraph-routed request verification
- final p50/p95/p99 and reliability evidence
- final Track 1 submission/evidence package

## 3. Telegraph integration contract

A Telegraph Miner wraps an API/model/dataset/tool. Veridex therefore has two layers:

```text
Veridex deterministic intelligence core
            ↑
Telegraph Miner adapter / API contract
            ↑
Telegraph protocol envelope
```

Do not redesign the Veridex engine around a guessed Intent.

### Current canonical Intent

The current official Telegraph Miner YAML standard publishes canonical Intents and does **not** list `FRAUD_DETECTION`. It does list `CONTENT_VERIFICATION`, which is semantically aligned with Veridex's evidence-backed contract capability verification.

The repository Miner YAML therefore declares:

```yaml
semantics:
  supported_intents:
    - CONTENT_VERIFICATION
```

Historical Telegraph team confirmation of `FRAUD_DETECTION` remains preserved as project history, but it is not treated as the current canonical protocol value without live registry confirmation.

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
Intent: CONTENT_VERIFICATION (current repository standard)
```

Registration was previously completed successfully. Because the Intent/YAML schema changed to match the current official standard, the live Telegraph registry must now prove that Miner #1001 has synchronized/re-registered the current configuration before the protocol gate can pass.

## 4. Current Telegraph operational state

The Miner is registered, but the Telegraph UI previously showed **Unranked / 0 Requests**.

Current working interpretation: this is a known Telegraph-side routing/ranking issue based on team feedback. It must not be presented as a confirmed Veridex defect without new evidence.

Next verification target:

```text
Telegraph-routed request
        ↓
Miner #1001
        ↓
Veridex /analyze
        ↓
compare with direct API result
        ↓
record latency/result/failure evidence
```

Never fabricate requests, traffic, users, ranking, demand or performance.

## 5. Hackathon timing

- **Track 1 — Miners:** 17 Aug–31 Aug 2026
- **Track 2 — Evaluation Scripts:** 17 Aug–31 Aug 2026
- **Track 3 — Applications/Agents:** 31 Aug–7 Sep 2026
- **H1 final operational boundary:** 7 Sep 2026

Re-verify official rules immediately before final submission because dates/criteria can change.

## 6. Execution plan

### Gate A — Phase 01 final correctness

1. real-chain proxy/non-proxy tests
2. curated ground-truth corpus
3. RPC timeout/recovery evidence
4. Telegraph request/response tests
5. full tests + typecheck + build
6. production smoke test

### Gate B — Performance/reliability

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

Target package completion: 28–30 Aug; final submission by 31 Aug.

Include:

- live Miner identity
- production endpoint
- current canonical Intent
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

If we enter Track 3, build a real application/agent that consumes live Telegraph Miners.

Do not fake demand with:

```text
agent → Veridex → same agent
```

Prefer a genuine multi-Miner consumption/selection/decision workflow when justified.

No mocks or fabricated usage.

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
- Continuous Watch
- Time Machine persistence
- Policy Engine
- alerts/email/webhooks/mobile
- native mobile
- 3D Contract Core
- broad multi-chain semantic analysis
- large capability expansion

These remain post-H1/optional.

## 11. Continuation rule

For a new chat/agent:

1. read `PROJECT_STATE.md`
2. read `AGENTS.md`
3. read `docs/ROADMAP.md`
4. read `docs/ARCHITECTURE.md`
5. read `docs/DECISIONS.md`
6. read this handoff
7. read `docs/phases/PHASE-00-CONSTITUTION.md`
8. read `docs/phases/PHASE-01-EVM-CORE.md`
9. inspect the actual current `main` tree and recent commits
10. verify live deployment before making production-readiness claims

**Next single engineering action:** close every remaining Phase 01 runtime/protocol evidence blocker. Do not begin post-H1 feature work until this gate is closed.
