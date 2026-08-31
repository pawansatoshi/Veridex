# Track 2 Validation Report

## Release status

**Status: NOT RELEASED / LIVE REGISTRATION #2084 REJECTED FOR TIME BUDGET**

This report is evidence-driven. No hidden-benchmark result is inferred from local fixtures.

## Candidate identity

- Source line: `telegraph/evaluation/neural/build_candidate.py` plus `build_candidate_fast.py`
- Pinned upstream baseline: `telegraphprotocol/telegraph-wasm-baseline`
- Upstream commit: `dfa0cf7fda72789267811ba2190f61a8eaacedf6`
- Current fast candidate path: `build_candidate_fast.py`
- Current branch: `track2-v10-hardening`
- Exact WASM: generated per CI run; not frozen until all gates pass
- SHA-256: `PENDING_GREEN_CI`

## Live Telegraph result — registration #2084

Registration #2084 for `FRAUD_DETECTION` was rejected by Telegraph because the evaluation fixture gate exceeded the hard time budget:

`evaluation exceeded its time budget: the fixture gate did not complete in time (10m40s elapsed, including module load).`

Interpretation: this was a **performance/runtime rejection**, not evidence that the scorer's ordering quality failed. The corresponding CI candidate had already passed the local primary ordering, contract-security ordering, mutation suite, public hard.json gate, and deterministic/runtime safety checks before its public Wazero step hit the GitHub 35-minute workflow cap.

## Pre-rejection CI evidence

The candidate associated with the V10.1 line demonstrated:

- WASM: **24,194,663 bytes** class
- imports: **0**
- primary preflight: **0 inversions**
- primary tournament: **55/55 wins, 0 losses, 0 ties**
- contract-security tournament: **6/6 wins**
- adversarial mutation suite: **157 tested, 0 failures**
- deterministic repeat and fresh-instance checks: pass
- fuzzing: pass
- sustained memory check: pass

The live rejection proves these local properties were not sufficient because Telegraph's own fixture gate has its own 10-minute module evaluation budget.

## Performance correction

The previous neural release path used the full 6-layer INT8 MiniLM-L6-v2 inference path. Even with question/ground-truth caching, live Telegraph registration #2084 exceeded the 10-minute fixture budget by ~40 seconds.

The release line has therefore moved to an explicitly bounded **fast neural path** which preserves the Veridex wrapper, cache, factual guards, provenance and zero-import architecture while reducing inference work:

- maximum tokenizer sequence length: **64 tokens**;
- maximum transformer layers executed: **5 of 6**;
- full pinned weight blob retained for reproducibility/provenance;
- full six-layer path remains available for regression/reference.

This is an engineering performance candidate, not yet an accepted Telegraph candidate.

## Historical regressions

- #1809: whitespace-only answer must be exactly `0`.
- #1818: historical 14/15 ordering loss against incumbent.
- #1821: historical 14/15 ordering loss against incumbent.

## Current verification workflow

The Track 2 final workflow now:

1. builds the fast neural candidate;
2. validates WASM structure/size/imports;
3. runs primary preflight and tournament;
4. runs contract-security preflight/tournament;
5. builds one pinned Wazero checker binary and reuses it;
6. runs strict hard.json;
7. runs adversarial mutation;
8. runs strict full Wazero compatibility;
9. records SHA-256 and uploads the exact artifact only after all gates pass.

The CI job timeout is **60 minutes**, because the public checker itself can be expensive. This CI timeout is not the Telegraph 10-minute module evaluation budget; the candidate must satisfy both.

## Registration policy

**No green gate → no registration.**

A registration binds the exact submitted bytes/hash. Any change to source or binary requires a new build, new hash and fresh registration. Pending is not acceptance.

## Evidence classification

- IMPLEMENTED LOCALLY: source changes on this branch.
- VALIDATED LOCALLY: only after the exact command has run successfully.
- CI VALIDATED: only after a successful GitHub Actions run for the exact commit.
- PUBLIC CHECKER PASSED: only after the public Wazero checker has passed.
- REGISTERED: only after on-chain registration exists.
- ACCEPTED BY TELEGRAPH: only after Telegraph accepts it.
- COMPETITIVE ON LIVE EVALUATION: only after Telegraph live evaluation provides evidence.
- OFFICIALLY SUBMITTED: only after the exact accepted artifact is used in the hackathon submission.

## Current status

**Fast V10 candidate: UNVERIFIED — CI run pending.**

Do not use any previously registered artifact for Track 2 submission. The next registration must use the exact artifact produced by the first complete green CI run of the fast path.
