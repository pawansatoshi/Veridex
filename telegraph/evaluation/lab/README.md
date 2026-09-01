# Veridex Track 2 Pre-Submit Lab

This lab is an engineering safety net for Track 2 candidate WASMs. It does not replace Telegraph's official evaluator and does not claim to predict hidden Stage-2 results.

## Goals

1. Reject candidates before an on-chain registration when known failure modes, semantic inversions, or score compression are visible locally.
2. Replay historical failures against every new candidate.
3. Stress ranking with independent shadow cases and deterministic metamorphic variants.
4. Inspect the final WASM artifact itself for size, imports, ABI and deterministic scoring.
5. Produce a reproducible RED/YELLOW/GREEN pre-registration verdict.

## Run

```bash
python3 telegraph/evaluation/lab/presubmit_lab.py /path/to/veridex-track2-final.wasm
python3 telegraph/evaluation/lab/presubmit_lab.py --strict /path/to/veridex-track2-final.wasm --json
```

`--strict` treats missing local inspection dependencies or a non-GREEN verdict as a failure. The lab scores through the actual WASM exports; it never reimplements the scorer in Python.

## Policy

GREEN is only a local pre-registration risk verdict. Telegraph's hidden Stage-2 benchmark is independent and cannot be guaranteed by this repository.

Recommended engineering targets are zero inversions, mean margin >= 0.20, and P10 margin >= 0.05 on the independent shadow corpus. These are internal safety thresholds, not Telegraph thresholds.

## Corpus design

The lab combines:

- independent semantic seeds;
- entity, numeric, date and directional traps;
- binary polarity;
- long-answer and tail-contamination variants;
- historical failure replay;
- baseline/candidate differential analysis when a second artifact is supplied by future tooling.

The corpus is intentionally separate from the official benchmark. Never tune the production scorer by deleting or altering official cases just to obtain a green result.
