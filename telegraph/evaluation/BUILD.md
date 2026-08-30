# Veridex Telegraph Track 2 scorer

This directory contains the freestanding `wasm32` scoring work used for the Telegraph Track 2 `FRAUD_DETECTION` challenge.

## Candidate lines

### 1. Historical compact evaluators

`veridex_evaluator_v6.c` and `veridex_evaluator_v7.c` are retained for regression/reference history. `veridex_evaluator_v9.c` is also retained as a source candidate, but is **not a release candidate**: its `breakdown_answer` implementation returns `0`, and its token offsets are `uint16_t`, so it is not safe for the >65,535-byte hardening gate.

### 2. Neural-hybrid evaluator — current engineering candidate

`neural/build_candidate.py` reproducibly builds `veridex-track2-final.wasm` from the pinned MIT-licensed Telegraph baseline commit `dfa0cf7fda72789267811ba2190f61a8eaacedf6`, which contains real INT8 MiniLM-L6-v2 weights and the protocol-compatible semantic/BM25 scoring pipeline.

Veridex adds a deterministic factual-integrity wrapper:

- exact normalized answer => `1.0`;
- empty/whitespace answer or empty ground truth => `0.0`;
- polarity/direction contradiction penalty;
- numeric mismatch penalty;
- numeric-question answer-shape guard;
- binary answer-shape/polarity guard where the ground truth is unambiguous;
- question-context contribution through answer-shape requirements;
- monotone power calibration to increase separation without intentionally changing the unguarded semantic ordering.

The wrapper is independently authored Veridex work. The embedded baseline source/weights remain upstream work and are disclosed under `neural/UPSTREAM_BASELINE_LICENSE.md`.

## Authoritative scoring / breakdown contract

`rank_answer` and `breakdown_answer` call the same `veridex_score` function. The breakdown buffer is five little-endian `f32` values:

`[base_semantic, factual_guard, question_guard, calibrated, final]`

Slot 4 is exactly the final `rank_answer` result. Empty/whitespace/empty-ground-truth inputs produce five zero values. The preflight rejects any disagreement between the breakdown final slot and `rank_answer`.

## Required exports

The final candidate must expose at least:

- `memory`
- `alloc(size: i32) -> i32`
- `dealloc(ptr: i32, size: i32)`
- `rank_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> f32`
- `breakdown_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> i32`

## Required behavior

- empty ground truth => exactly `0`
- empty or whitespace-only miner answer => exactly `0`
- exact normalized answer => exactly `1`
- finite score in `[0,1]`
- deterministic repeated and fresh-instance execution
- safe >65,535-byte input
- UTF-8/CJK/emoji/accented input tolerant
- embedded NUL tolerant
- no WASI/network/filesystem dependency inside the WASM
- binary <= 32 MiB

## Pre-registration gate

Run:

```bash
node telegraph/evaluation/track2-preflight.js veridex-track2-final.wasm telegraph/evaluation/track2-benchmark-v2.json
node telegraph/evaluation/track2-tournament.js veridex-track2-final.wasm telegraph/evaluation/track2-benchmark-v2.json
node telegraph/evaluation/track2-mutation-suite.mjs veridex-track2-final.wasm telegraph/evaluation/track2-benchmark-v2.json
```

Where available, also run the pinned public Wazero compatibility checker in strict mode. Any invalid score, import, zero-input failure, breakdown disagreement, nondeterminism or high-vs-low inversion is a release blocker.

## Competitive gate

The local suite is necessary but not sufficient. Telegraph's Stage 2 benchmark is independent/partly hidden. A candidate must be registered on-chain and evaluated by Telegraph before any claim of competitive placement is made.

The release pipeline is:

`source -> reproducible build -> wasm-validate -> size/import gate -> preflight -> tournament -> mutation suite -> public Wazero checker -> SHA-256/provenance record -> fresh registration -> wait for live status -> inspect Stage 2 metrics -> submit exact accepted artifact`

**No green gate, no registration.**

## Registration policy

Telegraph binds the exact uploaded bytes/hash to the registration. A changed binary requires a fresh registration. A `pending` registration is not an accepted registration. Never reuse a rejected registration for different bytes.
