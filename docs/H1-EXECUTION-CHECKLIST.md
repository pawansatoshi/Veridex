# Veridex H1 Execution & Submission Gate

Last verified: 2026-08-14

## Official Track timeline

- Track 1 Miner: Aug 17–Aug 31, 2026
- Track 2 Script Author: Aug 17–Aug 31, 2026
- Track 3 Applications: Aug 31–Sep 7, 2026
- Winner selection: Sep 8–Sep 18, 2026
- Announcement/prizes: Sep 19–Sep 25, 2026

Source of truth: https://hackathon.telegraphprotocol.com/rules

## Track 1 judging gates

### P0 — Protocol correctness

- [ ] Exact H1 supported Intent selected from the current official request/response/evaluation contract.
- [ ] No invented or semantically unrelated Intent.
- [ ] Telegraph request adapter implemented only after the contract is verified.
- [ ] Telegraph response schema and error behavior tested against the official contract.
- [ ] Miner registration/configuration verified.
- [ ] Health/readiness behavior verified.

### P0 — Deterministic quality

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
- [ ] Run the real-chain ground-truth corpus and record TP/TN/FP/FN/inconclusive.

### P0 — Reliability

- [x] RPC timeout.
- [x] Bounded retry.
- [x] Circuit breaker.
- [x] Application-revert vs infrastructure-failure classification.
- [x] Verification-provider failure classification.
- [x] Bounded request body and parser work.
- [ ] Run failure-injection suite against the deployed Miner.
- [ ] Verify recovery after provider timeout/outage.

### P0 — Performance

- [x] p50/p95/p99 latency instrumentation.
- [x] Bounded concurrency primitive.
- [ ] Benchmark representative real-chain corpus.
- [ ] Record cold/warm latency.
- [ ] Record RPC, verification, analysis and serialization latency where available.
- [ ] Measure failure rate and timeout rate.
- [ ] Measure cache/coalescing effectiveness if enabled.
- [ ] Publish reproducible benchmark methodology and results.

### P1 — Transparency / X

- [ ] Publish meaningful build progress.
- [ ] Publish benchmark methodology/results.
- [ ] Publish important failures and fixes when useful.
- [ ] Tag `@Telegraphprotoc` on judging updates.
- [ ] Do not manufacture engagement or inflate metrics.

## Track 3 operational gates

- [ ] Miner remains live and operational for the entire Track 3 window.
- [ ] At least one real application/agent consumes the live Miner.
- [ ] No mock/simulated Miner data in the application.
- [ ] Collect real request/latency/reliability evidence.
- [ ] Pursue legitimate demand; do not manufacture requests.
- [ ] Maintain public progress transparency.

## Global cash-prize guardrail

The official rules state that an Intent must have **at least 3 active Miners** and receive **at least 100 real Track 3 requests** to be eligible for global cash prizes.

This is an ecosystem condition, not something Veridex can satisfy alone. We must select an Intent with real ecosystem participation and actively pursue legitimate application demand.

## Current blocker

The repository intentionally has a schema-neutral Telegraph adapter because the exact H1 capability-intelligence Intent contract is not verified in the current accessible official material. Do not fabricate a protocol mapping.

Once the exact contract is confirmed, the adapter is the immediate implementation gate.

## Post-H1 explicitly excluded from this gate

- Wallet approval intelligence
- Solana/Sui/Aptos semantic analyzers
- Capability Passport runtime
- Continuous Watch runtime
- Policy engine
- Alert routing
- PWA/native mobile
- 3D Contract Core
- enterprise tooling

These remain part of the long-term architecture but must not block Track 1 correctness/performance.
