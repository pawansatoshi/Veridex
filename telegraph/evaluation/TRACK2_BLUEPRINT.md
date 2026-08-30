# Veridex Track 2 — Final Execution Blueprint

## Mission

Build a production-grade `FRAUD_DETECTION` scoring module that is coherent with Veridex's evidence-first contract-intelligence product and competitive in Telegraph's Stage 2 promotion benchmark.

No honest implementation can guarantee #1 before Telegraph runs the hidden benchmark. The engineering target is therefore **best defensible probability of promotion**, with no known structural or behavioral regressions.

## Architecture

### Semantic foundation

Use the pinned MIT-licensed Telegraph WASM baseline as an open-source semantic foundation. Its documented real-weights mode runs an INT8 MiniLM-L6-v2 encoder and combines semantic cosine similarity, BM25 lexical evidence, question relevance, ground-truth correctness and length quality.

### Veridex integrity layer

Wrap the semantic base with deterministic, domain-aware corrections:

1. Exact normalized equality => `1.0`.
2. Empty/whitespace answer or empty ground truth => `0.0`.
3. Strong contradiction penalty for polarity/direction/security flips.
4. Numeric mismatch penalty for altered values/percentages/units.
5. Numeric-question answer-shape protection.
6. Conservative monotonic score transform for separation.

The semantic model remains responsible for broad paraphrase meaning; Veridex guards protect high-impact factual inversions.

## Why this changes the old strategy

The old KB-scale scorer repeatedly reached 14/15 and then lost one hidden ordering decision. The observed leader family is roughly 24 MB because its representation has much more semantic capacity. The official baseline confirms that a real MiniLM model is an intended/working design for this scoring environment.

Do not increase binary size for appearance. Increase representational capacity only when it improves rank quality.

## Candidate lines

### A. Independent compact scorer

`veridex_evaluator_v9.c`

Keeps an independently authored fallback path for auditability and regression comparison.

### B. Neural hybrid — release candidate

`neural/build_candidate.py`

Builds a fresh Veridex wrapper around the pinned upstream baseline in a temporary CI workspace and produces `veridex-track2-final.wasm` only after validation.

This candidate is preferred for the next on-chain experiment because it combines high semantic capacity with Veridex factual guards.

## Local benchmark strategy

`track2-benchmark-v2.json` contains 50 seed cases. `track2-preflight.js` and `track2-tournament.js` must run before any registration.

Quality dimensions:

- exact matches
- semantic paraphrases
- partial answers
- unrelated answers
- wrong entity
- wrong value/unit
- wrong date
- polarity/negation
- direction inversion
- answer-shape errors
- Unicode/long input
- deterministic repetition

The benchmark is a regression corpus, not a reconstruction of Telegraph's hidden fixtures.

## Pre-registration gates

Every candidate must pass:

- valid WASM;
- required exports;
- zero imports / no WASI;
- empty answer and whitespace answer exactly `0`;
- empty ground truth `0`;
- exact normalized match `1`;
- finite `[0,1]` scores;
- deterministic repeated calls;
- long-input safety;
- UTF-8/CJK/emoji/accent tolerance;
- no high-vs-low local ordering inversions;
- meaningful score variance;
- <=32 MiB binary;
- public Wazero checker in strict mode where available;
- exact SHA-256 and provenance record.

## Live experiment policy

One variable at a time.

1. Build final candidate.
2. Run all local gates.
3. Record hash.
4. Pin to IPFS.
5. Register fresh on-chain.
6. Wait for `pending` → `active` or `rejected`.
7. Record the actual rejection/promotion metrics.
8. Use that result to select the next experiment.
9. Never resubmit stale/rejected registrations.

## Winning objective

Optimize the quantities that Telegraph uses for promotion:

- candidate wins against good/bad benchmark pairs;
- mean good-vs-bad separation margin;
- self-match quality;
- score variance/usable spread;
- rank consistency.

Do not optimize a pretty headline score if it sacrifices ordering.

## Provenance

The neural hybrid explicitly preserves provenance for the upstream MIT baseline. The repository must never imply that the upstream MiniLM weights or semantic implementation were authored by Veridex. The Veridex contribution is the integration/guard/calibration layer and the overall application architecture.

## Three-track coherence

Track 1 produces evidence-backed contract intelligence.

Track 2 evaluates whether answers preserve that intelligence accurately.

Track 3 turns the resulting intelligence into product/agent workflows.

The three tracks share Veridex's evidence-first product thesis even though each track has its own protocol interface and code path.

## Completion definition

Track 2 is only considered **finished** when:

- the final binary is reproduced from pinned sources;
- automated gates are green;
- Telegraph accepts the fresh registration;
- live Stage 2 evaluation is recorded;
- the exact accepted binary/hash is stored in the submission record;
- Track 2 form is submitted using that accepted registration.

Until then, repository status may be “implementation complete / live validation pending,” not “won.”
