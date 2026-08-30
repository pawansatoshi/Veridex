# Track 2 Validation Report

## Release status

**Status: NOT RELEASED / NOT REGISTERED**

This report is evidence-driven. No hidden-benchmark result is inferred from local fixtures.

## Candidate identity

- Source: `telegraph/evaluation/neural/build_candidate.py`
- Pinned upstream baseline: `telegraphprotocol/telegraph-wasm-baseline`
- Upstream commit: `dfa0cf7fda72789267811ba2190f61a8eaacedf6`
- Candidate family: Veridex neural-hybrid V10 hardening
- Current source commit: `a63c82beff9595ae2bcaa7a4c7faab7fc0fce7ee`
- Exact WASM: generated per CI run; not frozen until all gates pass
- SHA-256: `PENDING_GREEN_CI`

## First V10 CI evidence — run 33294105111

The first V10 hardening run proved the build and structural layer, but correctly blocked release at preflight.

- WASM size: **24,189,533 bytes**
- imports: **0**
- `wasm-validate`: passed
- build: passed
- preflight: **failed**
- observed ordering inversions: **3** before the later fresh-instance harness error

Observed inversions:

1. `Classify this payment link.` — high `equivalent` scored `0.191746`; low `opposite` scored `0.243748`.
2. `what was q3 revenue for apple` — high `cross-unit paraphrase` scored `0.554418`; low `wrong entity` scored `0.625143`.
3. `Is the contract owner trusted?` — high `synonym` scored `0.328603`; low `opposite` scored `0.343414`.

The same run also exposed a harness bug: `WebAssembly.instantiate(module, {})` returns an `Instance` directly, while the preflight incorrectly dereferenced `.instance`. This was fixed. The tournament received the same fresh-instance correction.

The inversion failures drove targeted V10.1 changes:

- broader contradiction pairs (`malicious↔legitimate`, `dangerous↔safe`, `unsafe↔safe`, etc.);
- conservative named-entity conflict protection using question + ground-truth context;
- fresh-instance preflight/tournament correction;
- corrected mutation-suite entity swapping;
- breakdown/rank consistency remains mandatory.

These changes are not claimed to have passed until the new CI run proves them.

## Hard gates

| Gate | Required result | Current status |
|---|---|---|
| WASM validation | pass | FIRST RUN PASS |
| Required exports | memory, alloc, dealloc, rank_answer, breakdown_answer | FIRST RUN PASS |
| Imports | exactly 0 | FIRST RUN PASS |
| Size | <= 32 MiB | FIRST RUN PASS: 24,189,533 B |
| Empty answer | exactly 0 | FIRST RUN PASSED BEFORE INVERSION FAILURE |
| Whitespace answer | exactly 0 | FIRST RUN PASSED BEFORE INVERSION FAILURE |
| Empty ground truth | exactly 0 | FIRST RUN PASSED BEFORE INVERSION FAILURE |
| Exact normalized answer | exactly 1 | FIRST RUN PASSED |
| Breakdown final | equals rank_answer | FIRST RUN PASSED |
| >65,535-byte input | safe | RUN REACHED AFTER INVERSION LOOP; fresh harness then failed |
| Unicode/CJK/emoji/accented input | safe | RUN REACHED AFTER INVERSION LOOP |
| Embedded NUL | safe | RUN REACHED AFTER INVERSION LOOP |
| Same-instance determinism | exact repeat | PASSED |
| Fresh-instance determinism | exact repeat | HARNESS BUG FOUND, FIXED |
| Benchmark inversions | 0 | **FAILED: 3** |
| Mutation suite | pass | NOT REACHED |
| Public Wazero compatibility checker | pass | NOT REACHED |

## Current rerun

A new Track 2 final workflow run is queued for the corrected source commit. It is the authoritative next gate. Until that run finishes, the candidate remains **UNVERIFIED**.

## Competitive metrics

The first run must not be treated as a release benchmark because the preflight failed. The final metrics will be recorded only from a green run:

- cases: `PENDING_GREEN_CI`
- high-vs-low pairs: `PENDING_GREEN_CI`
- wins: `PENDING_GREEN_CI`
- losses: `PENDING_GREEN_CI`
- ties: `PENDING_GREEN_CI`
- inversions: `PENDING_GREEN_CI`
- mean margin: `PENDING_GREEN_CI`
- median margin: `PENDING_GREEN_CI`
- worst margin: `PENDING_GREEN_CI`
- best margin: `PENDING_GREEN_CI`
- self-match: `PENDING_GREEN_CI`
- score standard deviation: `PENDING_GREEN_CI`
- invalid scores: `PENDING_GREEN_CI`
- deterministic repeatability: `PENDING_GREEN_CI`
- runtime: `PENDING_GREEN_CI`

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
