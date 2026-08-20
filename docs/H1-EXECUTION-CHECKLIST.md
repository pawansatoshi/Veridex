# Veridex H1 Execution & Submission Gate

Last verified: 2026-08-20

## Phase 01 Gate Status

**IMPLEMENTATION-COMPLETE / RUNTIME VERIFICATION IN PROGRESS**

The implementation is substantially complete and the live production Miner has now been exercised successfully at the HTTP layer. The gate is **not marked PASS** until the semantic runtime artifacts and current Telegraph protocol evidence are machine-verifiable.

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
- [x] Production deployment reached READY for the latest H1 verification commit.
- [x] Production `/health` returned HTTP 200 with `ok: true`.
- [x] Production `/metrics` returned HTTP 200.
- [x] Production runtime recorded 19 successful HTTP 200 `/analyze` requests in the H1 verification window.
- [x] Production runtime error aggregation reported no runtime errors in the selected 24-hour window.
- [ ] Execute complete unit/integration suite in CI and record result artifact.
- [ ] Record real-chain corpus TP/TN/FP/FN/inconclusive artifact.
- [ ] Execute controlled timeout/failure-injection test against deployed Miner.
- [ ] Verify recovery after provider timeout/outage.
- [ ] Record cold/warm benchmark results from target runtime.
- [ ] Verify exact current Telegraph canonical Intent/request/response contract.
- [ ] Verify official Telegraph protocol-path health/readiness and genuine routed request.

## Runtime evidence note

The latest production verification window produced exactly 19 successful `/analyze` requests. This is consistent with the configured verification lane: 3 real-chain corpus cases + 15 benchmark requests + 1 production-schema request. Vercel logs expose HTTP status and route but not response bodies, so semantic ground-truth and benchmark values are not inferred from the request count.

## Evidence policy

Repository presence is not equivalent to runtime verification. Runtime checkboxes may only move to `[x]` when a reproducible command or CI artifact demonstrates the result. No benchmark values, ground-truth results, protocol schemas, or demand are fabricated.

## Current external dependency

Telegraph Miner registration is already documented as successful, but ranking/request routing remains an external dependency. `Unranked / 0 Requests` must not be interpreted as a Veridex defect without independent evidence.

## Track 1 timeline

- Track 1 Miner: Aug 17–Aug 31, 2026
- Track 2 Script Author: Aug 17–Aug 31, 2026
- Track 3 Applications: Aug 31–Sep 7, 2026
- Winner selection: Sep 8–Sep 18, 2026
- Announcement/prizes: Sep 19–Sep 25, 2026

Source of truth: https://hackathon.telegraphprotocol.com/rules
