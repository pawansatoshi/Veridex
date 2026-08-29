# Veridex Telegraph Track 2 scorer

This directory contains the freestanding `wasm32` scorer source used for the Telegraph Track 2 candidate evaluator.

## Build

Requires clang with wasm32 target support:

```bash
clang --target=wasm32 -O3 -nostdlib \
  -Wl,--no-entry \
  -Wl,--export-memory \
  -Wl,--export=alloc \
  -Wl,--export=dealloc \
  -Wl,--export=rank_answer \
  -Wl,--export=breakdown_answer \
  -Wl,--initial-memory=262144 \
  -Wl,--max-memory=262144 \
  -o veridex-evaluator.wasm veridex_evaluator.c
```

## Required exports

- `memory`
- `alloc(size: i32) -> i32`
- `dealloc(ptr: i32, size: i32)`
- `rank_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> f32`
- `breakdown_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> i32`

## Scoring behavior

The scorer is deliberately deterministic and ground-truth anchored:

- empty ground truth or empty miner answer => `0`
- normalized exact answer match => `1`
- otherwise token overlap plus bounded length similarity
- no external calls, clocks, randomness, or mutable external state

The critical Track 2 structural property is that a correct self-match must score strictly above an unrelated cross-match.

## Release artifact

The Track 2 candidate artifact is built from this source and must be locally/runtime tested before registration. Do not reuse an older registered WASM after changing the source; Telegraph WASM registrations are immutable.
