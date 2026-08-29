# Veridex Telegraph Track 2 scorer

This directory contains the freestanding `wasm32` scorer source used for the Telegraph Track 2 `FRAUD_DETECTION` candidate evaluator.

## Current candidate

`veridex_evaluator_v7.c`

v7 is deterministic and ground-truth anchored. It combines lexical precision/recall, lightweight phrase evidence, conservative semantic equivalence classes, morphology, contradiction/direction checks, numeric equivalence, entity-conflict protection, and limited question-context relevance. It has no network, filesystem, clock, randomness, external state, or LLM dependency.

## Build

```bash
clang --target=wasm32 -O2 -ffreestanding -fno-builtin -nostdlib \
  -Wl,--no-entry -Wl,--export-memory \
  -Wl,--export=alloc -Wl,--export=dealloc \
  -Wl,--export=rank_answer -Wl,--export=breakdown_answer \
  -Wl,--initial-memory=4194304 -Wl,--max-memory=4194304 \
  -o veridex-evaluator-final.wasm veridex_evaluator_v7.c
```

The candidate must be a standalone WASM with no WASI imports and no dependency outside the module.

## Required exports

- `memory`
- `alloc(size: i32) -> i32`
- `dealloc(ptr: i32, size: i32)`
- `rank_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> f32`
- `breakdown_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> i32`

## Scoring protections

- empty ground truth => `0`
- empty or whitespace-only miner answer => exactly `0`
- normalized exact token match => `1`
- lexical precision/recall and short phrase-order evidence
- conservative semantic equivalence/contradiction groups
- morphology for common inflections
- numeric equivalence for comma/underscore formatting, k/m/b and common spelled units
- wrong-entity penalty using ground truth/question context
- direction and security-phrase contradiction checks
- bounded length and character n-gram contribution
- finite score clamped to `[0,1]`

## Benchmark and regression gates

`track2-benchmark-v2.json` contains 50 internally authored `FRAUD_DETECTION` cases spanning exact matches, paraphrases, synonym classes, polarity, direction, numbers, dates, entities, and adversarial ordering traps.

`track2-tournament.js` executes the benchmark as a pairwise ordering tournament and also checks required exports, exact-zero cases, long input, Unicode input, and deterministic repeated calls. It must report zero ordering inversions before registration.

GitHub Actions additionally builds the exact candidate, validates the WASM, checks the 32 MB limit and zero imports, runs the public Telegraph Wazero checker in strict mode, and then runs the local tournament before publishing the binary.

## Registration policy

Telegraph registration binds the exact uploaded bytes/hash and is not an in-place edit. Never reuse a rejected registration. A changed binary gets a fresh registration ID. After registering, wait for the status to leave `pending` and inspect the Explorer before using the ID in the Hackathon submission form.

Passing local/public pre-registration checks is necessary but does not guarantee a Stage-2 win: Telegraph's final benchmark is independent. The objective is robust ordinal quality, not overfitting to public probes.
