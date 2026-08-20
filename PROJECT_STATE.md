# Veridex — Persistent Project State

**Repository:** `pawansatoshi/Veridex`  
**Branch:** `main`  
**Current phase:** H1 MINER SUBMISSION-READY — BLOCKING CI VERIFIED GREEN

## H1 / Phase 01

Phase 01 implementation and runtime evidence are complete for the current H1 verification lane.

Verified evidence includes:

- production `/health` reachable with `ok: true`
- production `/metrics` reachable
- live `/analyze` traffic exercised successfully
- resilience recovery verification
- real-chain ground-truth verification
- production performance benchmark
- production response schema verification

## Phase 02

Phase 02 Proxy-Aware Composition is **COMPLETE / VERIFIED GREEN**.

Its proxy-composition regression gate is included in the blocking main CI workflow and passed in the latest successful H1 verification run.

## Phase 03

Phase 03 Capability Passport is **COMPLETE / VERIFIED GREEN**.

Verified in the blocking CI workflow through the dedicated capability-passport regression suite and current H1 runtime evidence.

Implemented:

- canonical capability passport schema
- stable passport identity
- evidence fingerprint
- posture/conclusive state
- capability evidence preservation
- regression tests

## Phase 04 — Continuous Watch

Phase 04 Continuous Watch is **IMPLEMENTED / VERIFIED GREEN for the H1 CI gate**.

Verified through the dedicated capability-watch test gate and the blocking main CI workflow.

Implemented:

- Capability Watch lifecycle model
- bounded minimum/maximum polling intervals
- adaptive backoff after failures and interval growth after successful observations
- per-tick observation budget
- versioned Capability Passport observations
- baseline/unchanged/changed/inconclusive comparison states
- evidence-backed capability diffing
- critical/warning/informational severity classification
- alert sink contract with evidence and previous/current passport state
- provider failure treated as inconclusive, never as a contract change
- pluggable `WatchStore` persistence boundary
- deterministic in-memory store for regression tests
- dedicated Phase 04 CI workflow
- Phase 04 gate in the main blocking CI workflow

The production persistence/scheduler boundary remains explicit: the domain layer does not pretend serverless memory is durable. A durable `WatchStore` and real scheduler must be supplied by deployment infrastructure before claiming a persistent production watch service. This does **not** block the H1 Miner submission gate.

## Current Telegraph registration

The active H1 Miner registration is:

- Miner ID: `1001`
- Slug: `veridex-contract-risk-miner`
- Registration: `#144`
- Intent: `FRAUD_DETECTION`
- Network: Base Sepolia
- Registration transaction: `0xe9df234aaf7c9f7501e9971f01705e52172b81bd4a2fd96932b22d5bc4b7ce6a`
- Primary production endpoint: `https://veridex-ecru.vercel.app`

Historical registrations `#122` and `#142` are superseded. The canonical current configuration is `#144 / FRAUD_DETECTION`.

## Latest verified H1 CI evidence

The latest successful blocking CI evidence recorded for the H1 verification lane showed:

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
- live Telegraph integration: **verified**
- resilience recovery: **verified**

The blocking workflow requires successful outcomes for audit, typecheck, build, unit tests, Phase 02 proxy tests, Phase 03 passport tests, Phase 04 watch tests, live health, YAML validation, live Telegraph integration, resilience, real-chain ground truth, deterministic evaluation, benchmark, and production schema.

## H1 status

**H1 Miner is SUBMISSION-READY.**

The remaining work is submission/package administration and any optional presentation polish, not reopening completed engineering phases.

Do not claim official Telegraph ranking or fabricated demand/traffic. Keep external ranking and request volume separate from Veridex's verified technical gates.

## Evidence policy

Repository presence alone is not runtime proof. Current claims above are based on successful CI/runtime evidence and the confirmed Base Sepolia registration transaction. Future changes to the main branch must be revalidated by the blocking CI workflow before this state is considered current again.
