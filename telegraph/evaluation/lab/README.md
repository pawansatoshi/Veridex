# Veridex Track 2 Pre-Submit Lab

This lab is an engineering safety net for Track 2 candidate WASMs. It does not replace Telegraph's official evaluator and does not claim to predict hidden Stage-2 results.

## One-command run

```bash
bash telegraph/evaluation/lab/run_presubmit.sh /path/to/veridex-track2-final.wasm
```

The command generates the v2 shadow corpus from three visible slices—seed, independent-v2, and the official benchmark—then scores the exact generated GOOD/BAD pairs through the candidate WASM and writes `presubmit-report.json`.

## Direct modes

```bash
python3 telegraph/evaluation/lab/generate_shadow_corpus_v2.py --rounds 16 --out telegraph/evaluation/lab/shadow_corpus.generated.json
python3 telegraph/evaluation/lab/presubmit_lab_v2.py --strict --json --corpus telegraph/evaluation/lab/shadow_corpus.generated.json --out presubmit-report.json /path/to/veridex-track2-final.wasm
```

## What the lab checks

- WASM structural/ABI smoke checks and zero imports.
- Actual candidate scoring through Node/WebAssembly, never a Python reimplementation.
- Expanded deterministic pairwise corpus with official, independent, and historical slices.
- Polarity/direction, binary, numeric, entity, relation, incompleteness, late contradiction, distractor, hedging, qualifier and composite mutations.
- Surface/context and longer-form variants.
- Historical replay of concrete failures observed in previous Veridex runs.
- Margin distribution: mean, median, P5, P10, worst and near-ties.
- Candidate SHA-256 and immutable artifact identity.
- RED/YELLOW/GREEN pre-registration verdict.

## Internal release policy

Mandatory: zero inversions in shadow and historical replay.

Preferred safety targets: mean margin >= 0.20 and P10 margin >= 0.05.

These are internal engineering thresholds, deliberately stricter than the observed 0.15 live rejection floor. They are not Telegraph's hidden thresholds and cannot guarantee hidden Stage-2 acceptance.

## Historical corpus

`historical_failures.json` preserves failure examples and classes from prior runs. Add every new production failure before another tuning cycle so future candidates are replayed against it automatically.

## Model arena

`model_arena.py` is an offline research tool. Compare `all-MiniLM-L6-v2`, `BAAI/bge-small-en-v1.5`, `intfloat/e5-small-v2`, or other candidate backbones on the same generated corpus. A better generic embedding model is not automatically a better Track-2 scorer; final selection still requires WASM size, determinism, factual/semantic guard compatibility, and official verification.

## Release principle

The lab is a pre-registration risk filter, not a hidden-benchmark oracle. Never weaken official gates, edit official cases to obtain green, hard-code visible benchmark questions, or claim a hidden result that has not been observed live.
