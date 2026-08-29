# Track 2 build and registration checklist

1. Build `veridex_track2_scorer.c` as freestanding WASM32.
2. Run `node telegraph/evaluation/track2/test_wasm.mjs`.
3. Confirm the binary exports `memory`, `alloc`, `dealloc`, and `rank_answer` and has no imports.
4. Upload the exact `.wasm` binary to Telegraph's WASM registration page (`integrate.telegraphprotocol.com/wasm`).
5. Use the platform's Stage 1 structural check and Stage 2 incumbent comparison. Do not claim a registration ID until Telegraph returns one.
6. Record the real registration ID, hash, intent, evaluation score, and status in project state only after the platform confirms them.
7. Submit that exact registration ID together with the exact same `.wasm` file in the Track 2 hackathon submission form.

The repository intentionally does not fabricate registration IDs or evaluation scores.
