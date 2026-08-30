# Veridex Telegraph Track 2 scorer

This directory contains the freestanding `wasm32` scoring work used for the Telegraph Track 2 `FRAUD_DETECTION` challenge.

## Candidate lines

### 1. Independent Veridex evaluator

`veridex_evaluator_v9.c` is the compact independently-authored scorer. It combines exact/normalized matching, lexical precision/recall, conservative semantic families, morphology, contradiction/direction checks, numeric equivalence, entity-conflict protection, and limited question/answer-shape relevance.

### 2. Neural-hybrid competitive evaluator — current strongest engineering path

`neural/build_candidate.py` reproducibly builds `veridex-track2-final.wasm` from the pinned MIT-licensed Telegraph baseline commit `dfa0cf7fda72789267811ba2190f61a8eaacedf6`, which contains real INT8 MiniLM-L6-v2 weights and the protocol-compatible semantic/BM25 scoring pipeline.

Veridex adds a deterministic factual-integrity wrapper around that semantic foundation:

- exact normalized answer => `1.0`;
- empty/whitespace answer or empty ground truth => `0.0`;
- polarity/direction contradiction penalty;
- numeric mismatch penalty;
- numeric-question answer-shape guard;
- gentle monotone score transform to increase separation without intentionally changing the unguarded semantic ranking.

The wrapper is our contribution; the embedded baseline model/weights remain upstream work and are disclosed under `neural/UPSTREAM_BASELINE_LICENSE.md`.

## Official baseline research

The official `telegraphprotocol/telegraph-wasm-baseline` repository documents a real MiniLM-L6-v2 sentence transformer, BM25 lexical signal, length quality and question/ground-truth relevance. It supports a `wasm32-unknown-unknown` real-weights build. The baseline is MIT licensed.

The official `telegraphprotocol/telegraph-examples` repository is also the canonical reference for live protocol usage, registration and verification flows.

## Required exports

The final candidate must expose at least:

- `memory`
- `alloc(size: i32) -> i32`
- `dealloc(ptr: i32, size: i32)`
- `rank_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> f32`
- `breakdown_answer(q_ptr, q_len, gt_ptr, gt_len, ma_ptr, ma_len) -> i32`

Extra exports are tolerated by the baseline tooling, but the required interface above must remain intact.

## Required behavior

- empty ground truth => `0`
- empty or whitespace-only miner answer => exactly `0`
- exact normalized answer => `1`
- finite score in `[0,1]`
- deterministic repeated execution
- long input and UTF-8 tolerant
- no WASI/network/filesystem dependency inside the WASM
- binary <= 32 MiB

## Pre-registration gate

Run:

```bash
node telegraph/evaluation/track2-preflight.js veridex-track2-final.wasm telegraph/evaluation/track2-benchmark-v2.json
node telegraph/evaluation/track2-tournament.js veridex-track2-final.wasm telegraph/evaluation/track2-benchmark-v2.json
```

Where available, also run the public Wazero checker in strict mode. Any invalid score, import, zero-input failure, nondeterminism or high-vs-low inversion is a release blocker.

## Competitive gate

The local suite is necessary but not sufficient. Telegraph's Stage 2 benchmark is independent/partly hidden. A candidate must be registered on-chain and evaluated by Telegraph before any claim of competitive placement is made.

The release pipeline is:

`source -> reproducible build -> wasm-validate -> size/import gate -> preflight -> tournament -> official Wazero checker -> SHA-256/provenance record -> fresh registration -> wait for live status -> inspect Stage 2 metrics -> submit exact accepted artifact`

**No green gate, no registration.**

## Registration policy

Telegraph binds the exact uploaded bytes/hash to the registration. A changed binary requires a fresh registration. A `pending` registration is not an accepted registration. Never reuse a rejected registration for different bytes.
