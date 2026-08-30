# Track 2 Validation Report

## Release status

**Status: NOT RELEASED / NOT REGISTERED**

This report is evidence-driven. No hidden-benchmark result is inferred from local fixtures.

## Candidate identity

- Source: `telegraph/evaluation/neural/build_candidate.py`
- Pinned upstream baseline: `telegraphprotocol/telegraph-wasm-baseline`
- Upstream commit: `dfa0cf7fda72789267811ba2190f61a8eaacedf6`
- Candidate family: Veridex neural-hybrid V10.1 hardening
- Current branch head: `b1e5631cc3740a7f964a55973a0aa18af2426a98`
- Exact WASM: generated per CI run; not frozen until all gates pass
- SHA-256: `PENDING_GREEN_CI`

## Iteration history

### First V10 run — 33294105111

Build/structural validation passed, but preflight found 3 ordering inversions. The failures were:

1. payment link: semantic equivalent lost to `legitimate and safe`;
2. Apple Q3 revenue: cross-unit paraphrase lost to wrong-entity answer;
3. trusted owner: synonym lost to dangerous opposite.

That run also exposed an incorrect JavaScript fresh-instance assumption. The harness was corrected.

### V10.1 rerun — 33294197111

The same exact candidate build passed the preflight gate:

- WASM: **24,192,001 bytes**
- imports: **0**
- cases: **49** in the current `track2-benchmark-v2.json`
- high-vs-low pairs: **55**
- inversions: **0**
- mean margin: **0.4689717406216501**
- worst margin: **0.00018387287855148315**
- self-match: **1**
- score stddev: **0.342690178381962**

The workflow then stopped in the tournament because the tournament harness still contained the same `WebAssembly.instantiate` return-shape bug. That harness is now fixed in the current branch.

### Benchmark-count discrepancy

The current file named `track2-benchmark-v2.json` contains **49 cases**, not the 50 cases described by older project context. This is now treated as a source-of-truth discrepancy rather than silently claiming 50. A separate six-case `track2-benchmark-contract-v1.json` supplemental suite was added to cover contract-security authority, evidence, overclaim and entity-conflict reasoning while preserving the `FRAUD_DETECTION` intent.

## Current rerun

The current branch has a fresh Track 2 workflow queued (`run 33294293728`) after the tournament harness correction and supplemental contract-security suite. Until that run completes, V10.1 remains **UNVERIFIED**.

## Hard gates

| Gate | Required result | Evidence/status |
|---|---|---|
| WASM validation | pass | V10.1 pass |
| Required exports | memory, alloc, dealloc, rank_answer, breakdown_answer | V10.1 pass |
| Imports | exactly 0 | V10.1 pass |
| Size | <= 32 MiB | V10.1 pass: 24,192,001 B |
| Empty answer | exactly 0 | V10.1 preflight pass |
| Whitespace answer | exactly 0 | V10.1 preflight pass |
| Empty ground truth | exactly 0 | V10.1 preflight pass |
| Exact normalized answer | exactly 1 | V10.1 preflight pass |
| Breakdown final | equals rank_answer | V10.1 preflight pass |
| >65,535-byte input | safe | V10.1 preflight reached and passed |
| Unicode/CJK/emoji/accented input | safe | V10.1 preflight reached and passed |
| Embedded NUL | safe | V10.1 preflight reached and passed |
| Same-instance determinism | exact repeat | V10.1 preflight pass |
| Fresh-instance determinism | exact repeat | V10.1 preflight pass after harness fix |
| Primary benchmark inversions | 0 | V10.1 preflight: 0 |
| Primary tournament | pass | **PENDING CURRENT RERUN** |
| Supplemental contract-security suite | 0 inversions | **PENDING CURRENT RERUN** |
| Mutation suite | pass | **PENDING CURRENT RERUN** |
| Public Wazero compatibility checker | pass | **PENDING CURRENT RERUN** |
| SHA-256 | recorded | **PENDING GREEN CI** |

## Competitive metrics

Do not treat the preflight summary as the final tournament report. The current tournament must produce:

- wins / losses / ties
- mean / median / worst / best margin
- self-match
- score stddev
- deterministic repeatability
- runtime
- inversion diagnostics with component scores

All remain pending until the current run completes.

## Historical regression gates

- #1809: whitespace-only answer must be exactly `0`.
- #1818: behavioral ordering loss against incumbent must not be repeated blindly.
- #1821: behavioral ordering loss against incumbent must not be repeated blindly.

## Registration policy

**No green gate → no registration.**

When a binary is registered, record the exact registration ID, exact SHA-256 and Telegraph acceptance status here. If the binary changes, create a new registration and preserve the historical record.

## Evidence classification

- IMPLEMENTED LOCALLY: source changes on this branch.
- VALIDATED LOCALLY: only after the exact command has run successfully.
- CI VALIDATED: only after a successful GitHub Actions run for the exact commit.
- PUBLIC CHECKER PASSED: only after the public Wazero checker has passed.
- REGISTERED: only after on-chain registration exists.
- ACCEPTED BY TELEGRAPH: only after Telegraph accepts it.
- COMPETITIVE ON LIVE EVALUATION: only after Telegraph live evaluation provides evidence.
- OFFICIALLY SUBMITTED: only after the exact accepted artifact is used in the hackathon submission.
