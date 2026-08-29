# Implementation note

Telegraph's validator model executes one canonical WASM script per Intent and expects a deterministic local score between 0 and 1. The current repository contains the Veridex scoring/evaluation logic and benchmark corpus; this directory is the Track 2 packaging boundary.

The final binary must be compiled against Telegraph's currently accepted WASM ABI and passed through the platform's registration validation before submission. Do not substitute a browser/WASI WASM build: validator execution must remain freestanding and deterministic.

Expected integration shape to verify against the current Telegraph submission validator before registration:

- linear memory
- `alloc(i32) -> i32`
- `dealloc(i32, i32)`
- `rank_answer(i32,i32,i32,i32,i32,i32) -> f32`
- `breakdown_answer` for component-level observability

No host imports, network calls, clock reads, randomness, or persistent mutable state are permitted.
