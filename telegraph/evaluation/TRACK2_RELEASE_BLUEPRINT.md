# Veridex Track 2 — Release Blueprint

## Objective

Produce the strongest defensible `FRAUD_DETECTION` scoring module for Telegraph Track 2 while keeping the implementation coherent with Veridex's evidence-first architecture.

The target is not simply a passing binary. Release quality means:

- Stage-1 structural/runtime gates pass;
- deterministic, bounded and standalone behavior;
- strong semantic and lexical ranking;
- explicit factual-integrity guards for numbers, entities and polarity;
- no known local ordering regressions;
- provenance and licensing are explicit;
- the exact released bytes are reproducible and hash-recorded;
- live Telegraph evaluation confirms the result before claiming a competitive win.

## Architecture

### Primary: Neural Hybrid

`telegraph/evaluation/neural/build_candidate.py` builds the current release candidate from the pinned official MIT-licensed Telegraph WASM baseline.

The baseline documents:

- real INT8 MiniLM-L6-v2 semantic embeddings;
- BM25 lexical scoring;
- question/ground-truth relevance;
- ground-truth correctness;
- length-quality scoring;
- freestanding `wasm32-unknown-unknown` execution.

Veridex adds a deterministic wrapper for:

1. empty/whitespace and empty-ground-truth hard-zero behavior;
2. normalized exact-match shortcut;
3. polarity/direction contradiction protection;
4. numeric mismatch protection;
5. numeric-question answer-shape protection;
6. a strictly monotone score transform intended to improve useful separation without deliberately changing semantic order.

### Fallback: Independent compact scorer

`veridex_evaluator_v9.c` is retained as an independently authored compact evaluator for regression, audit and fallback. It is not the preferred competitive release line while the neural hybrid is available.

## Official reference implementations

The development process uses the official repositories as protocol references:

- `telegraphprotocol/telegraph-examples` — live feature/registration/verification examples.
- `telegraphprotocol/telegraph-wasm-baseline` — official open-source WASM scoring reference and real MiniLM build path.

The pinned baseline source commit is:

`dfa0cf7fda72789267811ba2190f61a8eaacedf6`

## Competitive lesson

Observed top leaderboard binaries were roughly 24 MB and contained a very large static representation. The official baseline confirms why that size class is plausible: semantic-model weights and tokenizer data dominate the artifact while scoring code can remain comparatively small.

Size itself is not a score metric. The useful capability is semantic representation capacity.

## Benchmarks

`track2-benchmark-v2.json` is an internally authored regression corpus covering:

- exact answers;
- paraphrases;
- synonym/equivalence cases;
- partial answers;
- unrelated answers;
- wrong entities;
- wrong numeric values/units;
- wrong dates;
- polarity and direction flips;
- answer-shape errors;
- Unicode and long input.

`track2-preflight.js` performs runtime/edge checks and `track2-tournament.js` enforces pairwise high-vs-low ordering.

The internal benchmark is not a substitute for Telegraph's hidden Stage-2 fixtures. A benchmark should not be treated as an optimization target unless the incumbent/reference behaves sensibly on it.

## Failure-driven regression set

Historical registration failures remain regression evidence:

- #1766 — self-match/cross-match failure;
- #1772 — insufficient separation;
- #1792 — malformed WASM module;
- #1809 — whitespace answer not exactly zero;
- #1818 — 14/15 ordering vs 15/15 incumbent;
- #1821 — 14/15 ordering vs 15/15 incumbent.

These IDs are never reused for changed bytes.

## Release pipeline

`source → reproducible build → wasm validation → import/size gate → preflight → tournament → official Wazero checker → hash/provenance → IPFS → fresh Telegraph registration → wait → inspect live result → exact Track-2 submission`

**No green local gate → no registration.**

## Provenance

The neural hybrid uses an MIT-licensed official baseline. The full MIT notice is retained in `neural/UPSTREAM_BASELINE_LICENSE.md`.

The Veridex wrapper and product integration are the original contribution. Never describe the upstream semantic model/weights as Veridex-authored research.

Legacy calibration experiments derived from another upstream artifact are retained only for historical research and are not the default release candidate.

## Completion definition

Track 2 is complete only when:

1. the final binary is reproducibly built;
2. all local/CI gates are green;
3. the exact SHA-256 is recorded;
4. the fresh Telegraph registration is accepted/active;
5. the Stage-2 live result is recorded;
6. the exact accepted artifact/registration is submitted to the Hackathon form.

Until step 5, the correct status is **validation pending**, not “won.”
