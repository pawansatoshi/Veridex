# Final Track 2 candidates — FRAUD_DETECTION

## Primary engineering candidate: Veridex neural hybrid

`veridex-track2-final.wasm`

Build source:

`telegraph/evaluation/neural/build_candidate.py`

Pinned upstream baseline:

`telegraphprotocol/telegraph-wasm-baseline@dfa0cf7fda72789267811ba2190f61a8eaacedf6`

Design:

- real INT8 MiniLM-L6-v2 semantic scorer;
- BM25 lexical signal;
- question/ground-truth relevance;
- Veridex exact normalized match;
- deterministic contradiction/polarity guard;
- numeric mismatch guard;
- numeric-question answer-shape guard;
- monotone score transform;
- freestanding wasm32 with no WASI/network/filesystem dependency.

The binary is generated automatically by `.github/workflows/track2-final-verify.yml` only after structural, edge, tournament and public Wazero checks pass. The workflow then records SHA-256 and publishes the exact verified bytes to this path.

## Fallback: independent compact evaluator

`veridex_evaluator_v9.c`

This is the independently authored small-footprint scorer retained for regression, auditability and fallback use. It is not currently the preferred competitive candidate because the observed incumbent family has substantially richer semantic representation.

## Legacy calibration experiments

`veridex-calibrated-80.wasm`, `veridex-calibrated-86.wasm`, and `veridex-calibrated-88.wasm` remain historical competitive experiments derived from an upstream MIT-licensed benchmark artifact. They are **not** the primary release path until provenance, rule compliance and live performance have been separately confirmed.

## Selection policy

Never call a candidate a winner until Telegraph's live registration reports an accepted/active result and the resulting Stage 2 placement is observed. Local benchmark success is necessary but cannot prove the hidden benchmark result.
