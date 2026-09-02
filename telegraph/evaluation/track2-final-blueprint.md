# Track 2 Final Release Blueprint — R5

Status: LOCKED EXECUTION PLAN

## Golden baseline
- Git commit: `76486fa01a54b7d03c173dedf7a34852e2c38b57`
- Historical role: strongest evidenced live candidate lineage before the current investigation.
- Artifact SHA-256: `fd797ad1ef60d1e48d79e612d8b4c53108e87f7155de81a8a2f62833ff9d4544`
- Golden rule: every new candidate must be compared against 14.0 before registration.

## Proven failure lessons
1. Local synthetic margin is not a predictor of Telegraph hidden Stage-2 margin.
2. Monotone calibration alone did not move the live result; the k=3 logistic path is therefore rejected.
3. Strong guards can improve integrity while still destroying good-answer ranking when applied too broadly.
4. The hidden/live bottleneck is genuine ordinal discrimination, especially semantic paraphrase versus plausible but wrong answers.
5. The public benchmark is a regression suite, not a substitute for the hidden benchmark.

## Release sequence
`source -> build -> structural -> deterministic -> Wazero -> expanded fraud corpus -> golden-14.0 differential -> adversarial mutation -> pairwise margin -> 0.35 hard gate -> exact hash -> registration`

## Hard gates
- WASM valid.
- zero imports.
- size <= 32 MiB.
- required exports present.
- deterministic and fresh-instance deterministic.
- exact/empty/whitespace behavior correct.
- zero pairwise inversions on the full local suite.
- candidate does not regress the 14.0 golden baseline.
- mean pairwise margin >= 0.35.
- all scores finite and within [0,1].
- exact artifact SHA-256 and source provenance recorded.

## Scoring architecture
The primary score remains the pinned official MiniLM/BM25 baseline plus a Veridex factual-integrity layer. The wrapper must optimize `good - bad` pairwise separation rather than raw average score.

Semantic evidence should combine answer/ground-truth relevance with question-aware relevance. Factual guards are only hard when the contradiction is high-confidence. Uncertain entity, numeric, polarity, or negation signals must not zero or nearly-zero a semantically strong answer.

## Registration policy
No exploratory registrations. A registration is allowed only after all hard gates pass on CI. A live result is treated as validation evidence, not as a tuning feedback loop for arbitrary parameter sweeps.

## Success definition
Internal release target: mean margin >= 0.35 with zero inversions and no 14.0 regression. Live Telegraph result must then be observed and recorded before declaring competitive success.
