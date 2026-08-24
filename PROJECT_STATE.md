# Veridex — Persistent Project State

**Repository:** `pawansatoshi/Veridex`  
**Branch:** `main`  
**State reviewed:** 24 Aug 2026  
**Current phase:** H1 OPERATIONAL / UX HARDENING — PHASE 05B

## Current reality

The deterministic EVM analysis core, proxy-aware composition, Capability Passport domain layer, Continuous Watch domain layer, evaluation harness, production Miner endpoint, Telegraph YAML and Miner registration remain implemented. The current main branch now also contains dedicated product surfaces for analysis, Passport, Watch, Telegraph and documentation.

The engineering posture remains verification and operational hardening. UX work is a release-surface improvement, not a replacement analysis subsystem.

## Phase 01 — EVM Analysis Core

**Status: COMPLETE / historical H1 runtime evidence verified.**

Verified capabilities and infrastructure include strict EVM validation, address-first detection, resilient RPC, timeout/retry/circuit-breaker behavior, application-level revert classification, verification abstraction, instruction-boundary bytecode analysis, ownership/control, upgradeability/proxy foundation, pause capability/state, mint capability/authority, evidence provenance, normalized failure semantics, and production `/health`, `/metrics`, `/analyze`.

## Phase 02 — Proxy-Aware Composition

**Status: COMPLETE / historical CI gate verified.**

Implemented code/state address separation, implementation resolution, beacon semantics, composed/nested proxy handling, bounded lineage, cycle/max-depth handling and proxy regression coverage. A beacon address is never treated as an implementation without supported resolution.

## Phase 03 — Capability Passport

**Status: COMPLETE / historical CI gate verified.**

Implemented canonical passport schema, stable passport identity, evidence fingerprint, posture/conclusive state, capability evidence preservation and regression coverage. Durable production persistence remains post-H1 infrastructure work.

## Phase 04 — Continuous Watch

**Status: IMPLEMENTED / historical CI gate verified.**

Implemented watch lifecycle, bounded polling intervals, adaptive backoff, per-tick observation budget, versioned Passport observations, baseline/unchanged/changed/inconclusive comparison states, evidence-backed diffs, severity classification, alert sink contract, provider-failure-as-inconclusive semantics, pluggable `WatchStore`, deterministic in-memory store and dedicated tests.

A durable scheduler and production `WatchStore` are intentionally not claimed as deployed functionality.

## Phase 05 — UX / Information Architecture Overhaul

**Status: 05A COMPLETE / 05B COMPLETE / 05C PARTIAL / 05D–05E PLANNED.**

### 05A — Landing page clarity

The landing page now owns the first journey: navigation, single thesis hero + analyzer, evidence-before-interpretation proof, four capability questions, Capability ≠ Function concept, progressive on-page result and minimal footer. Future Passport/Watch/Telegraph marketing blocks were removed from the first interaction.

### 05B — Dedicated product surfaces

Implemented on `main`:

- `/analyze/` — full analyzer and live evidence journey
- `/passport/` — Capability Passport observation surface
- `/watch/` — browser-local watch workspace with manual re-checks
- `/telegraph/` — Miner, Intent, schema and operational boundary surface
- `/docs/` — product, evidence, proxy, Passport, Watch and API documentation

These surfaces consume the existing `/api/analyze` contract rather than duplicating the deterministic domain engine.

The Watch UI deliberately states that browser-local storage/manual checks are the current release surface. It does not claim a deployed scheduler, durable server-side WatchStore or background alert delivery.

The Telegraph surface presents recorded configuration and historical verification policy without turning historical measurements into current runtime claims.

### 05C — Progressive evidence

Partially implemented: plain-language first result, per-capability evidence blocks, Passport composition/verification details, raw JSON as deepest layer, and explicit inconclusive/unavailable states.

Remaining: richer capability-specific “Why?” explanations, evidence-backed interactive proxy graph, and forensic/provider diagnostics.

### 05D — Motion and spatial intelligence

Planned: evidence-flow animation tied to actual analysis events, reduced-motion path, lightweight SVG/2.5D mobile representation and capability-change visual delta.

### 05E — Accessibility and release QA

Planned: 320px/360px mobile QA, no horizontal overflow, touch-target review, keyboard navigation/focus, semantic heading order, reduced motion, no color-only meaning, success/error/inconclusive analysis QA and raw-JSON accessibility.

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

The integration gate now requires exactly one configured/live advertised Intent, `FRAUD_DETECTION`, and verifies that Intent against the canonical live registry. This is a correctness gate, not a claim that live registry alignment has been freshly re-verified after every subsequent commit.

## Historical H1 verification evidence

The latest previously recorded successful H1 verification lane showed deterministic Miner evaluation **PASSED**, quality **1.0**, accuracy **1.0**, evidence coverage **1.0**, conclusive **1**, false positives **0**, false negatives **0**, real-chain **3/3**, production benchmark **3/3**, schema `veridex.miner.v1`, historical live Telegraph integration verified, and resilience recovery verified.

These metrics remain historical until reproduced after current main-branch changes.

## Current blocking gate

The main CI workflow requires successful audit, typecheck, build, unit tests, Phase 02 proxy tests, Phase 03 passport tests, Phase 04 watch tests, production health, YAML validation, live Telegraph integration, resilience recovery, real-chain ground truth, deterministic evaluation, production benchmark and production response-schema checks.

**Current status:** not independently observed GREEN for the newest main commit through the available connector.

## H1 status

**Product/Miner implementation: submission-ready.**  
**Current-main verification: open.**

## Next milestones

1. complete Phase 05C evidence-explorer depth
2. add evidence-backed proxy graph and capability “Why?” explanations
3. implement Phase 05D real analysis-state motion
4. complete Phase 05E mobile/accessibility/release QA
5. reproduce the full current-main verification lane before making fresh performance or live-registry claims

## Evidence policy

Repository presence is not runtime proof. Never claim official Telegraph ranking, fabricated traffic/demand, current-commit CI GREEN, or live registry alignment without fresh evidence.
