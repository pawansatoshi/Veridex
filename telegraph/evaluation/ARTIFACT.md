# Veridex WASM artifact

`veridex-evaluator.wasm` is the freestanding evaluator binary built from `veridex_eval.c`.

Exports:

- `memory`
- `alloc`
- `dealloc`
- `rank_answer`
- `breakdown_answer`

The module is intentionally host-import free and deterministic. The binary must still be accepted by Telegraph's current registration validator before its registration ID is used for submission.
