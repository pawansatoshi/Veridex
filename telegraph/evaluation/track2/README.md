# Veridex Track 2 — Canonical WASM Scorer

This directory is the canonical Track 2 Script Author artifact for Veridex.

## Contract

The candidate exports:

- `rank_answer(question_ptr, question_len, ground_truth_ptr, ground_truth_len, answer_ptr, answer_len) -> f32`
- `alloc(size) -> ptr`
- `dealloc(ptr, size)`
- exported linear `memory`
- optional `breakdown_answer(...)` reserved for host diagnostics

The module is freestanding WASM32 with no imports. It is intentionally small and bounded.

## Scoring model

The evaluator is capability-aware rather than generic word-overlap matching. It evaluates the four Veridex high-confidence capability states:

- ownership — 30%
- upgradeability — 30%
- pause — 20%
- mint — 20%

Values are normalized to `true`, `false`, or `unknown`. Supported textual aliases are accepted for compatibility with structured and human-readable Miner answers.

Safety properties:

1. malformed values score zero;
2. duplicate capability keys score zero instead of using a last-write-wins interpretation;
3. omitted known capabilities are penalized;
4. `unknown` is only correct when the ground truth is also `unknown`;
5. evidence/conclusive metadata can add only a small quality bonus and can never compensate for an incorrect capability state;
6. the final score is bounded to `[0,1]`.

## Build

The source is `veridex_track2_scorer.c`.

Example freestanding build:

```sh
clang --target=wasm32 -O2 -nostdlib \
  -Wl,--no-entry,--export=alloc,--export=dealloc,--export=rank_answer,--export=breakdown_answer,--export-memory \
  --initial-memory=262144 --max-memory=262144 \
  -o veridex-track2.wasm veridex_track2_scorer.c
```

The production artifact must be compiled from this source and structurally checked by Telegraph before registration. Do not substitute a hand-edited or fake binary.

## Local verification

The companion test harness exercises:

- perfect match;
- capability mismatch;
- missing capability;
- malformed input;
- duplicate capability key;
- unknown/unknown handling;
- score bounds;
- required WASM exports.

Track 2 registration remains an external protocol action. The repository must never invent a WASM registration ID.
