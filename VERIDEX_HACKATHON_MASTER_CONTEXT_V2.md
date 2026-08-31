# VERIDEX HACKATHON — MASTER CONTEXT v2

## Read this first

This is the authoritative continuity note for the current Telegraph Hackathon work. It supersedes stale Track-2 notes when they conflict. Always inspect the live repository and workflow status before claiming anything is done.

## Product mission

Veridex is an evidence-first smart-contract capability intelligence product.

Core thesis:

**No Evidence → No Certainty.**

Veridex should explain what a contract can do, who can exercise that capability, what evidence supports the conclusion, and what remains uncertain.

## Three-track coherence

**Track 1 — Miner:** produces evidence-backed smart-contract capability intelligence.

**Track 2 — Script Author:** deterministically evaluates Miner answers and ranks accurate answers above weak, incomplete, unrelated or contradictory answers.

**Track 3 — Application:** turns Telegraph intelligence into real Veridex product workflows such as contract passport/history/monitoring/agent experiences.

Shared flow:

`evidence → intelligence → evaluation → product value`

Track 2 must remain conceptually aligned with Veridex; it must not become an unrelated generic NLP demo.

## Official references

- `telegraphprotocol/telegraph-examples` — end-to-end protocol examples, registration, payments, jobs and verification.
- `telegraphprotocol/telegraph-wasm-baseline` — open-source WASM scoring reference.

Pinned baseline for the current neural-hybrid build:

`dfa0cf7fda72789267811ba2190f61a8eaacedf6`

The baseline documents real INT8 MiniLM-L6-v2 inference, BM25 lexical scoring, question/ground-truth relevance and length-quality scoring, compiled for `wasm32-unknown-unknown`.

The baseline is MIT licensed. Preserve the MIT notice and provenance when redistributing/modifying it.

## Track 2 history

Historical rejected registrations are regression evidence, not candidates to resubmit:

- `#1766` — self-match/cross-match failure.
- `#1772` — insufficient separation.
- `#1792` — malformed WASM.
- `#1809` — whitespace answer returned `0.0097`, but protocol required exactly `0`.
- `#1818` — Stage 2 ordering: 14/15 vs incumbent 15/15.
- `#1821` — Stage 2 ordering: 14/15 vs incumbent 15/15.
- `#2084` — live `FRAUD_DETECTION` evaluation rejected at 10m40s including module load because the fixture gate exceeded Telegraph's hard time budget.

The lesson is: never spend another registration on an unverified candidate.

## Current Track 2 architecture

### Primary release path: bounded neural hybrid

`telegraph/evaluation/neural/build_candidate_fast.py`

The current builder:

1. clones the pinned MIT-licensed Telegraph baseline in a temporary build workspace;
2. patches `MAX_SEQ_LEN` to 64 and caps executed transformer layers at 5 for the performance candidate;
3. renames baseline exports;
4. adds a Veridex factual-integrity wrapper;
5. builds the real-weight MiniLM/BM25 scorer for `wasm32-unknown-unknown`;
6. emits the candidate only for CI validation.

Veridex wrapper layers include:

- empty/whitespace answer or empty ground truth → `0`;
- normalized exact match → `1`;
- polarity/direction contradiction guard;
- numeric mismatch guard with word-unit parsing;
- entity-conflict protection;
- answer-shape protection;
- context-aware explicit-equivalence handling that preserves factual guards;
- bounded deterministic score shaping.

The semantic base and its weights are upstream and are not described as original Veridex model research. Veridex's contribution is the wrapper, factual-integrity logic, integration and overall product architecture.

### Fallback: independent compact scorer

`telegraph/evaluation/veridex_evaluator_v9.c`

Retained for audit/regression/fallback; not the primary competitive path while the neural hybrid is usable.

## Competitive insight

Observed leading `FRAUD_DETECTION` binaries were approximately 24 MB and had much larger static representation than the original KB-scale Veridex rule scorer. The official baseline explains this size class through embedded model weights/tokenizer/semantic machinery.

Do **not** equate file size with quality. The objective is useful semantic representational capacity plus factual integrity and reliable ordering.

## Benchmark and tournament

Current seed benchmark:

`telegraph/evaluation/track2-benchmark-v2.json`

Current automated tools:

- `track2-preflight.js`
- `track2-tournament.js`
- `track2-mutation-suite.mjs`

The local benchmark is a regression suite. It is **not** the hidden Telegraph Stage 2 benchmark.

The release process also uses a supplemental contract-security benchmark and the strict public Wazero checker.

## Release gates

No registration until all relevant gates are green:

1. reproducible build from pinned source;
2. valid WASM;
3. required exports;
4. zero imports/no WASI dependency;
5. empty/whitespace answer exactly `0`;
6. empty ground truth `0`;
7. exact normalized answer `1`;
8. finite scores in `[0,1]`;
9. deterministic repeated/fresh execution;
10. long/UTF-8/NUL safety;
11. zero local ordering inversions;
12. contract-security ordering passes;
13. adversarial mutation passes;
14. strict public Wazero checks pass;
15. performance/memory margin is acceptable;
16. <=32 MiB binary;
17. SHA-256 and provenance recorded;
18. exact artifact frozen;
19. fresh Telegraph registration;
20. actual Telegraph acceptance and live Stage-2 result recorded.

## CI

`.github/workflows/track2-final-verify.yml` is the release gate.

The workflow deliberately triggers only on Track-2 code/benchmark/workflow changes, not documentation-only changes, because the public checker can take tens of minutes. It now uses a 60-minute GitHub job timeout and builds a pinned public Wazero checker once for reuse.

The workflow does **not** register candidates automatically.

## Current release experiment

Branch: `track2-v10-hardening`

PR: `#203` (open, draft)

Current head: `e6d4694be3e19d39e158b22fbac513cb7f69c10e`

The latest observed predecessor run (#124) built a 24,194,340-byte zero-import candidate but failed primary preflight on three explicit-equivalence/value pairs. The current source has been changed to make equivalence context-aware and non-early-returning while preserving factual guards.

A fresh Track-2 workflow is expected for the current source head; until it completes, the current candidate remains **UNVERIFIED**.

## Live registration discipline

Exact sequence:

`build → local gates → public checker → exact hash → IPFS → fresh registration → wait for pending → active/rejected → inspect live Stage 2 metrics → submit exact accepted artifact`

A `pending` state is not approval.

A changed binary always requires a new registration ID.

Do not alter bytes after registration.

## Winning objective

We want the strongest defensible probability of beating the incumbent, measured through:

- good-vs-bad ordering;
- candidate wins;
- good-vs-bad margin;
- self-match quality;
- score variance;
- rank consistency;
- robustness to semantic/factual adversarial cases;
- live runtime safety.

A hidden Stage 2 win cannot be guaranteed in advance.

## Provenance policy

Never hide upstream or competitor provenance.

The current neural-hybrid path uses the official MIT-licensed Telegraph baseline and documents that fact in:

`telegraph/evaluation/neural/UPSTREAM_BASELINE_LICENSE.md`

Legacy calibration experiments from other upstream work remain clearly labeled and are not the primary release path.

## Current status

**TRACK 2: VALIDATION PENDING.**

The current branch has an active controlled candidate and release documentation, but no current candidate is yet approved for registration. Historical registration #2084 remains rejected for runtime budget and must not be reused.

The correct final labels remain separate:

- IMPLEMENTED — source change exists;
- CI VALIDATED — exact commit has a successful Track-2 workflow;
- PUBLIC CHECKER PASSED — strict pinned Wazero checker passed;
- HASH FROZEN — exact artifact and SHA-256 recorded;
- REGISTERED — fresh on-chain registration exists;
- ACCEPTED — Telegraph accepts the candidate;
- COMPETITIVE — live Stage-2 evidence exists;
- SUBMITTED — exact accepted candidate is in the hackathon form.

## Non-negotiables

- Never claim a local benchmark is the official leaderboard.
- Never call a candidate #1 without live evidence.
- Never repeatedly register speculative binaries.
- Never conceal upstream provenance.
- Never weaken deterministic/sandbox guarantees to chase score.
- Keep Track 1/2/3 architecturally coherent.
