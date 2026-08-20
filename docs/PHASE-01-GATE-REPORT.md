# Veridex Phase 01 Gate Report

Date: 2026-08-20
Status: IMPLEMENTATION-COMPLETE / RUNTIME-VERIFICATION-IN PROGRESS

## Scope

Phase 01 is the EVM Capability Intelligence foundation for the H1 Miner. The repository contains deterministic capability analysis, resilience primitives, evaluation fixtures, real-chain corpus definitions, benchmark methodology, and the Miner HTTP/protocol boundary.

## Completed engineering evidence

- strict EVM address validation
- wallet-vs-contract gate via deployed bytecode
- evidence hierarchy
- instruction-boundary bytecode scanning
- selector collision regression protection
- ownership detection foundation
- upgradeability/proxy detection foundation
- pause detection foundation
- conservative mint detection foundation
- capability intelligence model
- capability diff model
- confidence/conclusive/inconclusive semantics
- RPC timeout and bounded retry
- circuit breaker
- application-revert vs infrastructure-failure classification
- verification-provider failure classification
- bounded request/parser work
- p50/p95/p99 instrumentation
- bounded concurrency
- deterministic adversarial ground-truth suite
- curated real-chain corpus with fixed labels and provenance
- live Miner registration evidence
- strengthened real-chain evaluator with per-capability TP/TN/FP/FN/inconclusive/unavailable/error accounting

## Runtime evidence captured 2026-08-20

### Production deployment

Commit `c187291d165d2111a3d53d82469e2a7838279bc2` deployed to the production Vercel deployment `dpl_6iryXJmUjKHWbFmqPgpAF1D4ujX7` and reached `READY`.

### Production health

`GET /health` returned HTTP 200 with `ok: true` and service `veridex-miner`.

### Production response traffic

Vercel production runtime logs show **19 POST `/analyze` requests, all HTTP 200**, during the verification window immediately after the deployment. The request fingerprint matches the configured H1 verification lane: 3 real-chain corpus requests + 15 benchmark requests + 1 production-schema request.

This proves that the production endpoint was exercised successfully at the HTTP layer. It does **not** by itself prove semantic ground-truth correctness because Vercel logs do not expose response bodies.

### Runtime errors

Vercel reports **no runtime errors** for the production project in the selected 24-hour window.

## Remaining blockers

The following still require direct machine-readable evidence before Phase 01 can be marked PASS:

1. complete unit/integration test result from GitHub Actions
2. real-chain ground-truth artifact containing TP/TN/FP/FN/inconclusive results
3. controlled deployed timeout/failure-injection evidence
4. deployed recovery-after-provider-outage evidence
5. cold/warm benchmark artifact with p50/p95/p99 values
6. exact current Telegraph canonical Intent/request/response contract verification
7. official Telegraph protocol-path health/readiness and genuine routed-request evidence

## Telegraph contract note

Current Telegraph documentation states that canonical Intents are live/on-chain and can change; the documentation explicitly instructs miners to read the live canonical set rather than relying on a static copied list. Therefore the repository's historical `FRAUD_DETECTION` confirmation remains recorded, but current live canonical-Intent evidence must be captured before the Phase 01 protocol gate is closed.

No unrelated Intent will be substituted merely to force registration or ranking.

## Integrity rule

No benchmark values, ground-truth results, protocol schemas, health checks, or deployment results are fabricated. Repository implementation is evidence of implementation, while runtime claims require reproducible runtime evidence.

## Exit condition

Phase 01 becomes PASS only when every runtime blocker above has machine-verifiable evidence attached to CI/release artifacts and the current official Telegraph contract is confirmed. Until then the correct state remains implementation-complete but gate-blocked.
