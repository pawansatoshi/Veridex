# Veridex Track 2 — Neural Hybrid Candidate

This directory contains the reproducible build path for the strongest current
Track 2 candidate.

## Design

The candidate uses the pinned MIT-licensed Telegraph WASM baseline as an
open-source semantic foundation. That baseline implements real INT8-quantized
MiniLM-L6-v2 inference, BM25 lexical scoring, question relevance,
ground-truth correctness and length quality.

Veridex wraps that scorer with a small deterministic factual-integrity layer:

- exact normalized match → 1.0;
- empty/whitespace answer or empty ground truth → 0.0;
- polarity/direction contradiction penalty;
- numeric mismatch penalty;
- numeric question answer-shape check;
- gentle monotone score power to increase separation without intentionally
  changing the order of unguarded examples.

The WASM itself has no network, filesystem, clock, randomness or external
runtime dependency.

## Reproducible build

```bash
python3 telegraph/evaluation/neural/build_candidate.py \
  --out telegraph/evaluation/veridex-track2-final.wasm
```

The script pins upstream to commit:

`dfa0cf7fda72789267811ba2190f61a8eaacedf6`

It clones the public repository in a temporary build directory, adds the
Veridex wrapper, builds with `--features real_weights` for
`wasm32-unknown-unknown`, and copies the resulting binary to the requested
output path.

## Release gate

The GitHub Actions workflow `.github/workflows/track2-final-verify.yml` runs:

1. neural-hybrid build;
2. `wasm-validate`;
3. 32 MiB size gate;
4. zero-import gate;
5. Veridex preflight edge/determinism checks;
6. pairwise benchmark tournament;
7. public Wazero checker in strict mode;
8. SHA-256 recording;
9. binary publication only after all gates pass.

The generated binary is therefore never intentionally published by the
workflow before the automated gates succeed.

## Provenance

See `UPSTREAM_BASELINE_LICENSE.md`. The upstream baseline is MIT licensed.
The Veridex wrapper is the original contribution in this directory. We do not
represent the embedded upstream semantic model or weights as original Veridex
model research.

## Important limitation

A local pass cannot prove first place on Telegraph's hidden Stage 2 benchmark.
The final proof is a live accepted registration and its resulting leaderboard/
evaluation status. Do not submit an unverified candidate just because its local
benchmark is green.
