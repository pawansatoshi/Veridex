# Veridex Evaluation & Verification Record

## Purpose

This document separates **historical verification evidence** from **current-commit verification**. Repository code and documentation are not themselves runtime proof.

## Current status — 24 Aug 2026

**Implementation:** submission-ready for H1 Track 1.  
**Current-commit verification:** open until a fresh blocking GitHub Actions run is independently observed.  
**Live Telegraph registry alignment:** must be re-verified after the latest exact-Intent gate hardening.

## Historical H1 evidence

The latest previously recorded successful blocking H1 lane reported:

- deterministic Miner evaluation: passed
- quality score: 1.0
- accuracy: 1.0
- evidence coverage: 1.0
- conclusive rate: 1
- false positives: 0
- false negatives: 0
- real-chain ground truth: 3/3 passed
- production benchmark: 3/3 successful requests per benchmark target
- production schema: `veridex.miner.v1`
- live Telegraph integration: verified at that historical commit
- resilience recovery: verified at that historical commit

These values are **historical artifacts**, not claims about the newest main-branch commit.

## Blocking CI contract

The authoritative workflow requires successful results for:

1. dependency/security audit
2. typecheck
3. build
4. unit tests
5. Phase 02 proxy-composition tests
6. Phase 03 Capability Passport tests
7. Phase 04 Capability Watch tests
8. production health
9. Telegraph YAML validation
10. live Telegraph integration
11. resilience recovery
12. real-chain ground truth
13. deterministic Miner evaluation
14. production benchmark
15. production response schema

A future code/documentation change invalidates the previous green claim until the blocking workflow passes again.

## Telegraph exact-Intent verification

The Veridex Miner contract is:

```text
Miner ID: 1001
Slug: veridex-contract-risk-miner
Intent: FRAUD_DETECTION
Registration: #144
Production: https://veridex-ecru.vercel.app
```

The live integration gate now requires all of the following:

- `FRAUD_DETECTION` is canonical in the live Intent registry.
- repository YAML declares exactly `FRAUD_DETECTION`.
- live Miner registry advertises exactly `FRAUD_DETECTION`.
- live base URL is the expected production endpoint.
- `/analyze` exists as a POST endpoint.

This prevents a false-green result caused by drift to another canonical Intent.

## Ground-truth requirements

The corpus should cover:

- Ownable and non-Ownable
- pausable and non-pausable
- mintable and non-mintable
- direct and proxy contracts
- transparent/UUPS patterns where supported
- beacon resolved/unresolved
- verified/unverified contracts
- selector collisions
- selectors embedded in PUSH data
- malformed bytecode
- RPC application reverts
- provider failures
- verification failures/timeouts
- unresolved implementations

For real-chain cases, preserve:

```text
case id
network
contract address
code/implementation address when applicable
verification source
expected capability labels
expected live state when applicable
verification date
block/observation metadata
```

## Metrics

Never fabricate or hand-edit benchmark values. Record:

- true positives
- true negatives
- false positives
- false negatives
- inconclusive
- unavailable
- errors
- accuracy
- evidence coverage
- conclusive rate
- end-to-end latency
- RPC latency
- verification latency
- analysis latency
- serialization latency
- p50/p95/p99
- timeout/error rate
- cache hit rate
- duplicate-request coalescing

## Interpretation rules

- Selector presence is not semantic proof.
- PUSH payload bytes are not instruction boundaries.
- Provider failure is not a negative contract finding.
- An application-level contract revert is not automatically an RPC failure.
- A beacon address is not an implementation address.
- Missing evidence is not evidence of absence.
- A degraded observation must not imply that a capability disappeared.
- Telegraph leaderboard position is external evidence and must be reported separately from Veridex's internal quality metrics.

## Reproducibility rule

Every published performance or correctness claim must identify the artifact/run from which it was obtained. If a value has not been measured for the current state, report it as unavailable rather than carrying forward an old number as if it were current.
