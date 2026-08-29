# Veridex Telegraph Track 2 scorer

This directory contains the freestanding `wasm32` scoring work used for the Telegraph Track 2 `FRAUD_DETECTION` challenge.

## Candidate lines

### Independent Veridex evaluator

`veridex_evaluator_v8.c`

v8 is independently authored and deterministic. It combines lexical precision/recall, morphology, conservative semantic equivalence classes, contradiction/direction checks, numeric equivalence, entity-conflict protection, limited question-context relevance and character n-gram similarity. It has no network, filesystem, clock, randomness, external state or LLM dependency.

### Competitive calibration line

`veridex-calibrated-80.wasm` / `veridex-calibrated-88.wasm` are **transparent calibration derivatives** of the MIT-licensed `fr_ss2.wasm` upstream benchmark artifact used during competitive analysis. They add a strictly increasing post-map around the upstream `rank_answer` and redirect the exported entry point. They are not presented as original semantic-model research. See `UPSTREAM_NOTICE.md` and `TRACK2_RELEASE_BLUEPRINT.md`.

## Independent evaluator build

```bash
clang --target=wasm32 -O2 -ffreestanding -fno-builtin -nostdlib \
  -Wl,--no-entry -Wl,--export-memory \
  -Wl,--export=alloc -Wl,--export=dealloc \
  -Wl,--export=rank_answer -Wl,--export=breakdown_answer \
  -Wl,--initial-memory=4194304 -Wl,--max-memory=4194304 \
  -o veridex-evaluator-final.wasm veridex_evaluator_v8.c
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

## Competitive gates

`track2-benchmark-v2.json` and `track2-tournament.js` provide the local ordering regression suite. The release gate is:

`compile -> validate -> zero imports -> official Wazero checker -> local tournament -> edge/determinism probes -> provenance/hash record -> fresh registration -> wait for live status`

The hidden Stage 2 benchmark is independent. Local results are regression evidence, not a guarantee of promotion.

## Registration policy

Telegraph binds the exact uploaded bytes/hash to the registration. Never reuse a rejected registration for changed bytes. A new candidate receives a fresh registration ID; inspect the live status before using that ID in the Hackathon submission.
