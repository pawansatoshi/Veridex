# Veridex — Persistent Project State

**Repository:** `pawansatoshi/Veridex`  
**Branch:** `main`  
**State reviewed:** 24 Aug 2026  
**Current phase:** H1 OPERATIONAL / TELEGRAPH TRACK SURFACE HARDENING — PHASE 06 COMPLETE

## Current reality

The deterministic EVM analysis core, proxy-aware composition, Capability Passport domain layer, Continuous Watch domain layer, evaluation harness, production Miner endpoint, Telegraph YAML/registration, dedicated product surfaces, progressive Evidence Explorer, evidence-backed spatial visualization and Telegraph Track 1/2/3 presentation surfaces are implemented.

Phase 05 UX implementation is complete. Phase 06 now separates the three H1 Telegraph tracks into focused judge-facing surfaces without changing Miner/core behavior.

## Phase 01 — EVM Analysis Core

**Status: COMPLETE / historical H1 runtime evidence verified.**

## Phase 02 — Proxy-Aware Composition

**Status: COMPLETE / historical CI gate verified.**

## Phase 03 — Capability Passport

**Status: COMPLETE / historical CI gate verified.**

## Phase 04 — Continuous Watch

**Status: IMPLEMENTED / historical CI gate verified.**

A durable scheduler and production `WatchStore` are intentionally not claimed as deployed functionality.

## Phase 05 — UX / Information Architecture Overhaul

**Status: COMPLETE — 05A through 05E implemented.**

The landing page, Analyze, Evidence, Passport, Watch, Telegraph and Docs surfaces are separated and the evidence explorer/spatial layer is presentation-only.

## Phase 06 — Telegraph Track Surfaces

**Status: COMPLETE — 06A through 06H implemented at the presentation/documentation layer.**

### 06A — Telegraph hub

`/telegraph/` is now a focused hub for the three H1 tracks with clear routing and a separate product-layer explanation for Passport and Watch.

### 06B — Track 1 Miner

`/telegraph/miner/` documents Miner `1001`, registration `#144`, `FRAUD_DETECTION`, the deterministic pipeline, evidence hierarchy, failure semantics and machine-readable contract.

### 06C — Track 2 Evaluation

`/telegraph/evaluation/` documents the ground-truth/evaluation workflow and deliberately shows unavailable current metrics as `—` until freshly measured.

### 06D — Track 3 Application

`/telegraph/application/` documents the real application-to-Miner flow and routes users to the live analyzer/evidence surfaces.

### 06E — Passport integration

Passport remains a first-class product surface and is explicitly not mislabeled as a Telegraph track.

### 06F — Watch integration

Watch remains a longitudinal product surface with current manual/browser-local boundaries preserved.

### 06G — Navigation/mobile consistency

Track pages use compact navigation, responsive layouts and reduced-motion support.

### 06H — Judge journey

The intended journey is Home → Analyze → Evidence, with Telegraph → Miner/Evaluation/Application and Passport/Watch as deeper product surfaces.

## Current Telegraph registration

- Miner ID: `1001`
- Slug: `veridex-contract-risk-miner`
- Registration: `#144`
- Intent: `FRAUD_DETECTION`
- Network: Base Sepolia
- Production endpoint: `https://veridex-ecru.vercel.app`

## Current blocking gate

The main verification lane requires audit, typecheck, build, unit tests, proxy/passport/watch tests, production health, YAML validation, live Telegraph integration, resilience recovery, real-chain ground truth, deterministic evaluation, production benchmark and production response-schema checks.

**Current-main status:** not independently observed GREEN through the available connector. Do not convert repository presence into runtime proof.

## H1 status

**Product/Miner implementation: submission-ready.**  
**UX implementation: complete.**  
**Telegraph Track 1/2/3 presentation: complete.**  
**Current-main verification: open.**

## Next milestones

1. reproduce the complete current-main verification lane
2. verify live Telegraph registry alignment and preserve fresh evidence
3. freeze the Track 1/H1 evidence package
4. verify Track 2 evaluation output from the current commit
5. keep the production Miner and Track 3 application stable through the operational window
6. only then resume post-H1 WatchStore, alerts, agents/SDK/MCP and broader product expansion

## Evidence policy

Repository presence is not runtime proof. Never claim official Telegraph ranking, fabricated traffic/demand, current-commit CI GREEN, or live registry alignment without fresh evidence.
