# Veridex — Persistent Project State

**Repository:** `pawansatoshi/Veridex`  
**Branch:** `main`  
**State reviewed:** 29 Aug 2026  
**Current phase:** H1 OPERATIONAL / TELEGRAPH TRACK 2 HARDENING

## Current reality

The deterministic EVM analysis core, proxy-aware composition, Capability Passport domain layer, Continuous Watch domain layer, evaluation harness, production Miner endpoint, Telegraph YAML/registration, dedicated product surfaces, progressive Evidence Explorer, evidence-backed spatial visualization and Telegraph Track 1/2/3 presentation surfaces are implemented.

Track 1 Miner registration is live. Track 2 candidate WASM registration was attempted, but the first candidate failed Telegraph structural validation because its self-match score did not beat an unrelated cross-match. That failure is now treated as a real blocker rather than a documentation claim.

## Track 2 incident and remediation

**Observed failure:** Telegraph rejected registration `#1766` during submission with:

`structural validation failed: self-match (0.0000) did not beat unrelated cross-match (0.0000)`

This proves the previously supplied candidate artifact was not acceptable for Track 2, even though it passed the upload/hash/on-chain registration UI.

**Root cause:** the previous evaluator did not provide sufficient behavioral discrimination for the platform's self-match structural gate.

**Remediation:** added `telegraph/evaluation/veridex_evaluator.c` and `telegraph/evaluation/BUILD.md`. The replacement evaluator is deterministic, ground-truth anchored, exports the required ABI, returns `0` for empty inputs, returns `1` for normalized exact matches, filters common stopwords for overlap, and otherwise scores bounded token overlap/length similarity. A locally instantiated WASM build was verified to export `memory`, `alloc`, `dealloc`, `rank_answer`, and `breakdown_answer`, with self-match `1.0`, unrelated example `0.0`, paraphrase-like overlap `0.2819`, and empty input `0.0`.

**Release artifact:** `veridex-evaluator-v2.wasm` was built from the new source. SHA-256: `4ae038a9e5ee99036f3bef4efc5be7529e72db17ff051a9f5b10a368deb1b285`.

**Important:** Telegraph WASM registrations are immutable. Registration `#1766` must not be submitted as a valid Track 2 candidate. A fresh registration is required for the replacement artifact.

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

`/telegraph/evaluation/` documents the ground-truth/evaluation workflow. The scorer implementation is now also checked into `telegraph/evaluation/veridex_evaluator.c` with a reproducible build contract.

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

## Track 2 registration status

- Previous candidate registration: `#1766`
- Intent: `FRAUD_DETECTION`
- Status: **REJECTED AT SUBMISSION STRUCTURAL VALIDATION**
- Replacement artifact: `veridex-evaluator-v2.wasm`
- Replacement artifact SHA-256: `4ae038a9e5ee99036f3bef4efc5be7529e72db17ff051a9f5b10a368deb1b285`
- Fresh registration: **PENDING**

## Current blocking gate

The main verification lane requires audit, typecheck, build, unit tests, proxy/passport/watch tests, production health, YAML validation, live Telegraph integration, resilience recovery, real-chain ground truth, deterministic evaluation, production benchmark and production response-schema checks.

**Current-main status:** not independently observed GREEN through the available connector. Do not convert repository presence into runtime proof.

## H1 status

**Product/Miner implementation: submission-ready.**  
**UX implementation: complete.**  
**Track 1: registered/live; operational status must be freshly verified.**  
**Track 2: replacement scorer built and locally verified; fresh on-chain registration/submission still required.**  
**Track 3: presentation/application surface implemented; Track 3 opens after Track 1/2 close.**

## Next milestones

1. register the replacement Track 2 WASM artifact
2. wait for registry indexing and verify the new registration appears under the connected wallet
3. submit the new registration ID with the exact same replacement WASM bytes
4. verify Track 2 submission acceptance, not merely on-chain registration
5. freeze the Track 1/H1 evidence package
6. keep the production Miner stable through the operational window
7. only then resume post-H1 WatchStore, alerts, agents/SDK/MCP and broader product expansion

## Evidence policy

Repository presence is not runtime proof. Never claim official Telegraph ranking, fabricated traffic/demand, fabricated benchmark numbers, current-commit CI GREEN, or live registry alignment without fresh evidence.
