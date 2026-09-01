# Veridex Track 2 Pre-Submit Lab

This lab is an engineering safety net for Track 2 candidate WASMs. It does not replace Telegraph's official evaluator and does not claim to predict hidden Stage-2 results.

## One-command run

```bash
bash telegraph/evaluation/lab/run_presubmit.sh /path/to/veridex-track2-final.wasm
```

This first generates the scaled shadow corpus from the independent seed set plus the repository's current official benchmark as a separate source slice, then scores the candidate through its actual WASM exports and writes `presubmit-report.json`.

Direct modes:

```bash
python3 telegraph/evaluation/lab/generate_shadow_corpus.py --rounds 12
python3 telegraph/evaluation/lab/presubmit_lab.py --strict --json --out presubmit-report.json /path/to/veridex-track2-final.wasm
```

## What it checks

- WASM size/import/export surface and ABI smoke checks.
- Actual candidate scoring through Node/WebAssembly, not a Python reimplementation.
- Thousands of deterministic shadow pairs made from official benchmark pairs plus independent seeds.
- Semantic mutations: polarity/direction, number, entity, relation, incompleteness, late contradiction, distractor and composite mutations.
- Surface diversity: answer/context wrappers and long-form variants.
- Historical replay of previously observed Veridex failures.
- Semantic invariance on harmless case/punctuation/context variants.
- Score distribution: mean/median/P5/P10/worst margin and near-ties.
- RED/YELLOW/GREEN pre-registration risk verdict.

## Internal release policy

Use zero inversions as mandatory. Use mean margin >= 0.20 and P10 margin >= 0.05 as internal safety targets. These are deliberately stricter than the observed 0.15 on-chain rejection floor and are not claimed to be Telegraph's hidden thresholds.

A GREEN result means the candidate has lower locally observable registration risk. It does not guarantee hidden Stage-2 acceptance. Telegraph's hidden benchmark remains independent.

## Historical corpus

`historical_failures.json` records concrete failure classes and examples from earlier runs, including polarity flips, incomplete binary answers, compound polarity, wrong entities, contradiction and numeric-completeness cases. Add every new production failure here before starting another tuning cycle.

## Model arena

`model_arena.py` is an offline research tool for comparing embedding backbones on the same Track-2 corpus. It can compare MiniLM, BGE-small-v1.5, E5-small-v2, or any other Sentence-Transformers model available in the environment. This arena does not automatically change the production WASM. Model selection must still satisfy WASM size, determinism, runtime and factual-guard constraints.

## Important boundary

The lab is designed to be harder than the public probe set without gaming it. Never delete or edit official benchmark cases to make a candidate pass. Keep official, historical and independent shadow slices visible separately in reports.
