# Veridex Telegraph Track 2 scorer

This directory contains the freestanding `wasm32` scorer source used for the Telegraph Track 2 FRAUD_DETECTION candidate evaluator.

## Current candidate

`veridex_evaluator_v6.c`

The v6 design is conservative and deterministic. It ranks answers using ground-truth-anchored lexical evidence with additional signals for semantic classes, contradiction/direction, numeric equivalence and entity mismatch. It is not an LLM and has no network, filesystem, clock, randomness or external state.

## Build

Requires clang with wasm32 target support:

```bash
clang --target=wasm32 -O2 -ffreestanding -fno-builtin -nostdlib \
  -Wl,--no-entry \
  -Wl,--export-memory \
  -Wl,--export=alloc \
  -Wl,--export=dealloc \
  -Wl,--export=rank_answer \
  -Wl,--export=breakdown_answer \
  -Wl,--initial-memory=2097152 \
  -Wl,--max-memory=2097152 \
  -o veridex-evaluator-final.wasm veridex_evaluator_v6.c
```

## Required exports

- `memory`
- `alloc(size: i32) -> i32`
- `dealloc(ptr: i32, size: i32)`
- `rank_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> f32`
- `breakdown_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> i32`

## Scoring behavior

- empty ground truth => `0`
- empty or whitespace-only miner answer => exactly `0`
- normalized exact token match => `1`
- lexical precision/recall + phrase-order evidence
- conservative semantic equivalence classes
- contradiction penalties for opposite polarity/direction classes
- numeric equivalence for comma/underscore formatting and k/m/b suffixes
- conservative wrong-entity penalty
- bounded length contribution so verbosity cannot dominate
- scores are finite and clamped to `[0,1]`

## Pre-registration gate

Before any new on-chain registration, CI must:

1. compile with `wasm32`;
2. validate the binary with `wasm-validate`;
3. confirm zero imports;
4. confirm all required exports;
5. run the official `neromtoobad/telegraph-wasm-check` through Wazero with `--strict` and `fraud-detection-cases.json`;
6. run additional Veridex ordering and determinism probes;
7. enforce the 32 MB size limit.

A CI pass proves the candidate is locally/structurally ready; it does not guarantee a win against Telegraph's hidden benchmark. Stage 2 is intentionally independent.

## Registration policy

Telegraph registrations bind the exact uploaded bytes/hash and are immutable in-place. Never resubmit an already rejected registration. A changed scorer must receive a fresh registration. After registration, wait for indexing and inspect the live status before using the ID in the hackathon submission form.
