# Veridex H1 Execution & Submission Gate

Last verified: 2026-08-19

## Phase 01 Gate Status

**IMPLEMENTATION-COMPLETE / VERIFICATION-BLOCKED**

The Phase 01 implementation and repository evidence are present. The gate is **not marked PASS** until the live test suite and real-chain verification have produced machine-verifiable results from the target runtime.

## Required exit evidence

- [x] Strict EVM address validation.
- [x] Wallet-vs-contract gate using deployed bytecode.
- [x] Evidence hierarchy.
- [x] Instruction-boundary bytecode scanning.
- [x] Selector collision regression protection.
- [x] Ownership capability foundation.
- [x] Upgradeability/proxy capability foundation.
- [x] Pause capability foundation.
- [x] Mint capability foundation with conservative evidence semantics.
- [x] Capability Intelligence model.
- [x] Capability Diff model.
- [x] Explicit confidence/conclusive/inconclusive states.
- [x] RPC timeout, bounded retry and circuit breaker.
- [x] Application-revert vs infrastructure-failure classification.
- [x] Verification-provider failure classification.
- [x] Bounded request body/parser work.
- [x] p50/p95/p99 latency instrumentation.
- [x] Bounded concurrency.
- [x] Versioned deterministic ground-truth fixture suite.
- [x] Curated real-chain corpus with fixed expected labels and provenance.
- [ ] Execute complete unit/integration suite in CI and record result.
- [ ] Execute real-chain corpus against the live Miner and record TP/TN/FP/FN/inconclusive.
- [ ] Execute controlled timeout/failure-injection test against deployed Miner.
- [ ] Verify recovery after provider timeout/outage.
- [ ] Record cold/warm benchmark results from target runtime.
- [ ] Verify exact Telegraph H1 Intent request/response contract and replace schema-neutral adapter.
- [ ] Verify Miner health/readiness and registration through the official protocol path.

## Evidence policy

Repository presence is not equivalent to runtime verification. A checkbox may only move to `[x]` for the runtime-dependent items after a reproducible command or CI artifact demonstrates the result.

Do not fabricate protocol schemas, benchmark numbers, ground-truth labels, or deployment health.

## Current external dependency

Telegraph Miner registration is already documented as successful, but the Miner remains externally dependent on Telegraph ranking/request routing. `Unranked / 0 Requests` must be treated as an ecosystem-side state until independently demonstrated otherwise.

## Track 1 timeline

- Track 1 Miner: Aug 17–Aug 31, 2026
- Track 2 Script Author: Aug 17–Aug 31, 2026
- Track 3 Applications: Aug 31–Sep 7, 2026
- Winner selection: Sep 8–Sep 18, 2026
- Announcement/prizes: Sep 19–Sep 25, 2026

Source of truth: https://hackathon.telegraphprotocol.com/rules
