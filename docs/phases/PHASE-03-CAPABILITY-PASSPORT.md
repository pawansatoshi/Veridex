# Phase 03 — Capability Passport

## Status

**IMPLEMENTED — VERIFICATION PENDING**

Phase 03 converts one verified Veridex analysis into a canonical, machine-readable capability identity without inventing historical state.

## Scope

The passport contains:

- stable subject identity (`chain + contractAddress`)
- deterministic `passportId`
- deterministic evidence fingerprint
- observation timestamp
- capability posture: `established | partial | inconclusive`
- ownership / upgradeability / pause / mint findings
- confidence and conclusive state
- detection method and evidence for every capability
- proxy composition status and effective code address when available
- verification evidence
- provider status

## Invariants

1. The same contract on the same chain receives the same `passportId` across observations.
2. Observation time does not alter the evidence fingerprint.
3. Material evidence changes alter the evidence fingerprint.
4. Inconclusive evidence never becomes an established posture.
5. Provider failure is preserved as provider state and never converted into a negative finding.
6. The passport does not imply historical state. Persistence and historical diffs remain later Change Intelligence work.
7. Evidence is canonicalized before hashing so object-key ordering cannot create false identity changes.

## Exit gate

Phase 03 is green only when:

- typecheck passes
- build passes
- full unit suite passes
- dedicated passport invariants pass
- security audit passes
- existing Phase 01/02 blocking gates remain green
- production deployment is READY on the verified commit
- project state records the exact verification evidence

## Next phase

Phase 04 is **Continuous Watch**: persisted observations, adaptive polling, safe change detection and watch lifecycle. It must consume the passport identity/fingerprint rather than reimplement capability semantics.
