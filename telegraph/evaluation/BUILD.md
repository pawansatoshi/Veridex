# Veridex Telegraph Track 2 scorer

This directory contains the freestanding `wasm32` scoring work used for the Telegraph Track 2 `FRAUD_DETECTION` challenge.

## Candidate lines

### Independent Veridex evaluator — v9

`veridex_evaluator_v9.c` is the current independent candidate source. It is deterministic and freestanding. It combines exact/normalized matching, lexical precision/recall, conservative semantic families, morphology, contradiction/direction checks, numeric equivalence, entity-conflict protection, limited question/answer-shape relevance, and bounded scoring.

The question is no longer merely parsed and discarded: v9 uses question tokens for ground-truth relevance, numeric-question answer-shape checks, and binary/yes-no answer-shape checks. These are deliberately low-weight so the ground truth remains the primary anchor.

### Competitive calibration line

`veridex-calibrated-80.wasm` / `veridex-calibrated-88.wasm` are transparent calibration derivatives of the MIT-licensed `fr_ss2.wasm` upstream benchmark artifact used during competitive analysis. They are not presented as original semantic-model research. See `UPSTREAM_NOTICE.md` and `TRACK2_RELEASE_BLUEPRINT.md`. Do not submit an upstream-derived artifact until provenance/licensing has been reviewed against the final hackathon rules.

## Independent evaluator build

```bash
clang --target=wasm32 -O2 -ffreestanding -fno-builtin -nostdlib \
  -Wl,--no-entry -Wl,--export-memory \
  -Wl,--export=alloc -Wl,--export=dealloc \
  -Wl,--export=rank_answer -Wl,--export=breakdown_answer \
  -Wl,--initial-memory=4194304 -Wl,--max-memory=4194304 \
  -o veridex-evaluator-v9.wasm veridex_evaluator_v9.c
```

## Required exports

- `memory`
- `alloc(size: i32) -> i32`
- `dealloc(ptr: i32, size: i32)`
- `rank_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> f32`
- `breakdown_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> i32`

## Required behavior

- empty ground truth => `0`
- empty or whitespace-only miner answer => exactly `0`
- normalized exact token match => `1`
- finite score clamped to `[0,1]`
- deterministic repeated calls
- long input and UTF-8 tolerant
- no WASI imports / no external dependency

## Pre-registration gate

Run:

```bash
node telegraph/evaluation/track2-preflight.js veridex-evaluator-v9.wasm telegraph/evaluation/track2-benchmark-v2.json
```

The gate checks required exports, zero imports, hard zero-input behavior, self-match, pairwise high-vs-low ordering, long/Unicode/NUL probes, determinism, mean/worst margin and score variance. A non-zero inversion count is a release blocker.

`track2-benchmark-v2.json` contains 50 regression cases. The benchmark is not a substitute for Telegraph's hidden Stage 2 benchmark; it is a regression/quality gate. Do not assume a local 50-case pass guarantees promotion.

## Competitive gates

`compile -> validate -> zero imports -> official Wazero checker -> preflight/tournament -> edge/determinism probes -> provenance/hash record -> fresh registration -> wait for live status -> compare result -> submit exact accepted artifact`

**No green gate, no registration.**

## Registration policy

Telegraph binds the exact uploaded bytes/hash to the registration. Never reuse a rejected registration for changed bytes. A new candidate receives a fresh registration ID; inspect live status before using that ID in the Hackathon submission.
