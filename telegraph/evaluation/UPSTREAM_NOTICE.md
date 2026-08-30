# Track 2 upstream provenance notice

## Primary neural-hybrid candidate

The current primary Track 2 build uses the public, MIT-licensed repository:

`https://github.com/telegraphprotocol/telegraph-wasm-baseline`

Pinned commit:

`dfa0cf7fda72789267811ba2190f61a8eaacedf6`

That repository documents real INT8 MiniLM-L6-v2 scoring, BM25 lexical scoring, question/ground-truth relevance and length quality. The Veridex contribution is the reproducible wrapper/integration layer that adds deterministic factual-integrity guards and the Track-2 release pipeline.

The full upstream MIT notice is retained at:

`telegraph/evaluation/neural/UPSTREAM_BASELINE_LICENSE.md`

## Legacy calibration experiments

`veridex-calibrated-80.wasm`, `veridex-calibrated-86.wasm`, and `veridex-calibrated-88.wasm` were historical calibration derivatives of a separate MIT-licensed benchmark artifact used during competitive research. They are not the primary release path.

## Policy

- Never present upstream model weights or source as original Veridex research.
- Keep required copyright/license notices with redistributed substantial portions.
- Pin and record exact source commits/hashes for reproducibility.
- Do not conceal competitor or upstream provenance.
- Do not register an artifact until its provenance/licensing and final Hackathon-rule compatibility have been reviewed.
