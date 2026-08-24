# Veridex — Persistent Project State

**Repository:** `pawansatoshi/Veridex`  
**Branch:** `main`  
**State reviewed:** 24 Aug 2026  
**Current phase:** H1 OPERATIONAL / SUBMISSION HARDENING

## Current reality

The repository is materially beyond the original H1 build roadmap. The deterministic EVM analysis core, proxy-aware composition, Capability Passport domain layer, Continuous Watch domain layer, evaluation harness, production Miner endpoint, Telegraph YAML and Miner registration are implemented.

The correct current engineering posture is **verification and operational hardening**, not another feature sprint.

Historical H1 CI evidence was verified on an earlier commit. The available GitHub connector does not expose a fresh blocking Actions run for the newest main-branch commits, so the current main branch must **not** be described as current-commit CI GREEN until a new blocking run is independently observed.

## Phase 01 — EVM Analysis Core

**Status: COMPLETE / historical H1 runtime evidence verified.**

Verified capabilities and infrastructure include:

- strict EVM validation
- address-first detection and wallet/contract gate
- resilient RPC
- timeout/retry/circuit-breaker behavior
- application-level revert classification
- verification abstraction
- instruction-boundary bytecode analysis
- ownership/control
- upgradeability/proxy foundation
- pause capability/state
- mint capability/authority
- evidence provenance
- normalized failure semantics
- production `/health`, `/metrics`, `/analyze`

## Phase 02 — Proxy-Aware Composition

**Status: COMPLETE / historical CI gate verified.**

Implemented:

- code/state address separation
- implementation resolution
- beacon semantics
- composed/nested proxy handling
- lineage and bounded depth
- cycle/max-depth handling
- proxy regression suite

A beacon address is never treated as an implementation without supported resolution.

## Phase 03 — Capability Passport

**Status: COMPLETE / historical CI gate verified.**

Implemented:

- canonical passport schema
- stable passport identity
- evidence fingerprint
- posture/conclusive state
- capability evidence preservation
- regression suite

Durable production persistence remains post-H1 infrastructure work.

## Phase 04 — Continuous Watch

**Status: IMPLEMENTED / historical CI gate verified.**

Implemented:

- watch lifecycle model
- bounded polling intervals
- adaptive backoff
- per-tick observation budget
- versioned Passport observations
- baseline/unchanged/changed/inconclusive comparison states
- evidence-backed capability diffs
- severity classification
- alert sink contract
- provider failure treated as inconclusive
- pluggable `WatchStore`
- deterministic in-memory store
- dedicated tests and blocking CI gate

A durable scheduler and production `WatchStore` are intentionally not claimed as deployed functionality.

## Current Telegraph registration

The current repository state records:

- Miner ID: `1001`
- Slug: `veridex-contract-risk-miner`
- Registration: `#144`
- Intent: `FRAUD_DETECTION`
- Network: Base Sepolia
- Registration transaction: `0xe9df234aaf7c9f7501e9971f01705e52172b81bd4a2fd96932b22d5bc4b7ce6a`
- Primary production endpoint: `https://veridex-ecru.vercel.app`

Historical registrations `#122` and `#142` are superseded.

## Telegraph verification hardening — 24 Aug 2026

A real verification gap was identified in the previous integration gate: it accepted any canonical Intent advertised by the live Miner registry. That could produce a false-green integration result if Veridex were registered under a different Intent.

Implemented:

- `scripts/verify-telegraph-yaml.mjs` now requires exactly one configured Intent and requires it to be `FRAUD_DETECTION` by default.
- the YAML gate also requires `FRAUD_DETECTION` to be canonical in the live Intent registry.
- `scripts/verify-telegraph-integration.mjs` now requires the live Miner to advertise exactly `FRAUD_DETECTION`.
- a regression test locks the repository configuration and both exact-Intent checks.

This is a correctness gate, not a claim that the live registry has already been re-verified after the change.

## Historical H1 verification evidence

The latest previously recorded successful H1 verification lane showed:

- deterministic Miner evaluation: **PASSED**
- quality score: **1.0**
- accuracy: **1.0**
- evidence coverage: **1.0**
- conclusive: **1**
- false positives: **0**
- false negatives: **0**
- real-chain: **3/3 passed**
- production benchmark: **3/3 successful requests per benchmark target**
- production schema: `veridex.miner.v1`
- live Telegraph integration: **verified at that historical commit**
- resilience recovery: **verified at that historical commit**

These metrics remain historical until reproduced after current main-branch changes.

## Current blocking gate

The main CI workflow requires successful outcomes for:

- audit
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

**Current status:** not independently observed GREEN for the newest main commit through the available connector.

## H1 status

**Product/Miner implementation: submission-ready.**  
**Current-commit verification: open.**

The highest-value next work is:

1. verify live Telegraph registry state for Miner `1001` / `FRAUD_DETECTION`
2. run and observe the complete blocking CI gate on the post-hardening commit
3. preserve fresh benchmark, real-chain, resilience and schema artifacts
4. finalize the Track 1 evidence package
5. keep the live Miner stable for Track 3

Do not begin unrelated post-H1 feature work while these gates remain open.

## Evidence policy

Repository presence is not runtime proof. Never claim official Telegraph ranking, fabricated traffic/demand, current-commit CI GREEN, or live registry alignment without fresh evidence.
