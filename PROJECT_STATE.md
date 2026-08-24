# Veridex — Persistent Project State

**Repository:** `pawansatoshi/Veridex`  
**Branch:** `main`  
**State reviewed:** 24 Aug 2026  
**Current phase:** H1 OPERATIONAL / UX HARDENING

## Current reality

The deterministic EVM analysis core, proxy-aware composition, Capability Passport domain layer, Continuous Watch domain layer, evaluation harness, production Miner endpoint, Telegraph YAML and Miner registration remain implemented. The current main branch adds a focused UX/information-architecture hardening pass without changing the analysis contract.

The engineering posture remains verification and operational hardening. UX work is being performed as a release-surface improvement, not as a new analysis subsystem.

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

## Phase 05 — UX / Information Architecture Overhaul

**Status: 05A IMPLEMENTED / 05B–05E PLANNED.**

Phase 05A replaces the overloaded landing page with a focused hierarchy:

1. navigation
2. single thesis hero + analyzer
3. evidence-before-interpretation proof
4. four capability questions
5. Capability ≠ Function concept
6. progressive on-page analysis result
7. minimal footer

The landing page no longer presents future Passport/Watch surfaces, Telegraph metrics, or a large language-selection block as if they were equally important to the first user journey. The primary analyzer copy is explicitly Ethereum mainnet because current H1 semantic analysis is Ethereum mainnet only.

Dedicated `/analyze`, `/passport`, `/watch`, `/telegraph` and `/docs` surfaces remain planned for later UX phases.

Phase document: `docs/phases/PHASE-05-UX-IA-OVERHAUL.md`.

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
**Current-main verification: open.**

## Next UX milestones

1. verify Phase 05A landing page at mobile and desktop widths
2. split full analyzer into `/analyze` without duplicating domain logic
3. move Passport, Watch and Telegraph explanations to dedicated surfaces
4. add progressive evidence disclosure and real analysis-state motion
5. complete accessibility and mobile overflow QA

## Evidence policy

Repository presence is not runtime proof. Never claim official Telegraph ranking, fabricated traffic/demand, current-commit CI GREEN, or live registry alignment without fresh evidence.
