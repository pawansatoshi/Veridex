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

The baseline repository documents real INT8 MiniLM-L6-v2 inference, BM25 lexical scoring, question/ground-truth relevance and length-quality scoring, compiled for `wasm32-unknown-unknown`.

The baseline is MIT licensed. Preserve the MIT notice and provenance when redistributing/modifying it.

## Track 2 history

Historical rejected registrations are regression evidence, not candidates to resubmit:

- `#1766` — self-match/cross-match failure.
- `#1772` — insufficient separation.
- `#1792` — malformed WASM.
- `#1809` — whitespace answer returned `0.0097`, but protocol required exactly `0`.
- `#1818` — Stage 2 ordering: 14/15 vs incumbent 15/15.
- `#1821` — Stage 2 ordering: 14/15 vs incumbent 15/15.

The lesson is: never spend another registration on an unverified candidate.

## Current Track 2 architecture

### Primary release path: neural hybrid

`telegraph/evaluation/neural/build_candidate.py`

The builder:

1. clones the pinned MIT-licensed Telegraph baseline in a temporary build workspace;
2. renames the baseline's primary scorer exports;
3. adds a Veridex wrapper;
4. builds the real-weight MiniLM-based scorer for `wasm32-unknown-unknown`;
5. emits `telegraph/evaluation/veridex-track2-final.wasm` when the CI gate passes.

Veridex wrapper layers:

- empty/whitespace answer or empty ground truth → `0`;
- normalized exact match → `1`;
- polarity/direction contradiction guard;
- numeric mismatch guard;
- numeric-question answer-shape guard;
- monotone score transform for separation.

The semantic base and its weights are upstream and are not described as original Veridex model research. Veridex's contribution is the wrapper, factual-integrity logic, integration and overall product architecture.

### Fallback: independent compact scorer

`telegraph/evaluation/veridex_evaluator_v9.c`

Retained for audit/regression/fallback; not the primary competitive path while the neural hybrid is usable.

## Competitive insight

Observed leading FRAUD_DETECTION binaries were approximately 24 MB and had much larger static representation than the original KB-scale Veridex rule scorer. The official baseline explains this size class through embedded model weights/tokenizer/semantic machinery.

Do **not** equate file size with quality. The objective is useful semantic representational capacity plus factual integrity and reliable ordering.

## Benchmark and tournament

Current seed benchmark:

`telegraph/evaluation/track2-benchmark-v2.json`

Current automated tools:

- `track2-preflight.js`
- `track2-tournament.js`

They test required exports, zero imports, zero-input behavior, self-match, local high-vs-low ordering, long/Unicode/NUL inputs, determinism, margin and variance.

The local benchmark is a regression suite. It is **not** the hidden Telegraph Stage 2 benchmark.

Future expansion should include generated/mutated cases for:

- entity swap;
- numeric mutation;
- date mutation;
- direction flip;
- negation;
- surface-overlap traps;
- incomplete answers;
- answer-shape mismatch;
- multilingual/Unicode stress.

Do not optimize to public probes alone.

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
12. meaningful score variance;
13. <=32 MiB;
14. public Wazero checker in strict mode where available;
15. SHA-256 and provenance recorded.

## CI

`.github/workflows/track2-final-verify.yml` is the release gate. It builds the neural hybrid, validates the WASM, runs preflight and tournament, runs the public Wazero checker, records SHA-256 and only then publishes the exact candidate.

The workflow is configured to avoid self-triggering on its generated binary/hash output.

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
- robustness to semantic/factual adversarial cases.

A hidden Stage 2 win cannot be guaranteed in advance.

## Provenance policy

Never hide upstream or competitor provenance.

The current neural-hybrid path uses the official MIT-licensed Telegraph baseline and documents that fact in:

`telegraph/evaluation/neural/UPSTREAM_BASELINE_LICENSE.md`

Legacy calibration experiments from other upstream work remain clearly labeled and are not the primary release path.

## Current status

The neural-hybrid release path is implemented in the repository. The remaining proof is external: CI must pass, the exact final binary must be available, Telegraph must accept a fresh registration, and the live Stage 2 result must be recorded.

Until those external steps succeed, the correct label is **validation pending**, not “#1” or “won.”

## Next agent checklist

1. Read this file.
2. Read `telegraph/evaluation/BUILD.md`.
3. Read `telegraph/evaluation/TRACK2_BLUEPRINT.md`.
4. Read `telegraph/evaluation/TRACK2_RELEASE_BLUEPRINT.md`.
5. Read `telegraph/evaluation/TRACK2_TOP3_AUDIT.md`.
6. Read `telegraph/evaluation/neural/README.md` and license notice.
7. Inspect the latest Track 2 workflow run and logs.
8. Inspect the generated final WASM before upload.
9. Run or confirm all gates.
10. Only then perform a fresh Telegraph registration.
11. Record the live result and update this document.

## Non-negotiables

- Never claim a local benchmark is the official leaderboard.
- Never call a candidate #1 without live evidence.
- Never repeatedly register speculative binaries.
- Never conceal upstream provenance.
- Never weaken deterministic/sandbox guarantees to chase score.
- Keep Track 1/2/3 architecturally coherent.
