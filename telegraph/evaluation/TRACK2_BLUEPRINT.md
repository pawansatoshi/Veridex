# Veridex Track 2 — Winning Blueprint

## Objective

Build the strongest defensible `FRAUD_DETECTION` scoring module for Telegraph Track 2 without overfitting to published probes.

The target is not merely Stage 1 validity. The candidate must also compete on Stage 2 ordinal ordering and separation against the current champion.

## Competitive finding

Three supplied leaderboard binaries were audited directly. Each is ~23.99 MB, has a 30 MiB minimum memory, ~31 KB of code, and the same ~23.96 MB data section. Their data payloads are byte-for-byte identical across all three files, while their code varies only slightly. Their export surface is `memory`, `alloc`, `dealloc`, `rank_answer`, and `TELEGRAPH_INTENT`.

The most defensible interpretation is that the leaders use a shared embedded semantic/feature representation plus variant scoring/calibration logic. The exact model/table identity is not proven from the binaries alone.

This explains the size difference: Veridex's earlier candidates were lightweight rule/lexical scorers, whereas the leaders spend substantial binary budget on static representational capacity. Size itself is not a scoring metric; representational capacity is the likely reason it can improve semantic discrimination.

See `TRACK2_TOP3_AUDIT.md` for the measurements and caveats.

## Historical rejection regression set

- #1766 — self-match failed against unrelated cross-match.
- #1772 — lost to champion on separation.
- #1792 — malformed WASM code section.
- #1809 — whitespace answer scored 0.0097 instead of exactly 0.
- #1818 — 14/15 benchmark ordering wins versus champion 15/15.
- #1821 — 14/15 benchmark ordering wins versus champion 15/15.

These IDs are historical evidence only and must not be resubmitted.

## v7 architecture

`veridex_evaluator_v7.c` is the current candidate implementation.

It is deterministic and freestanding `wasm32` with no network, filesystem, clock, randomness, external model, or hidden state.

Scoring layers:

1. normalized exact-token equality;
2. lexical precision/recall;
3. morphology-aware token matching;
4. conservative semantic-equivalence groups;
5. adjacent phrase evidence and character n-gram similarity;
6. numeric extraction/equivalence, including separators and common units;
7. entity-conflict protection using ground truth and question context;
8. explicit polarity/direction/security contradiction checks;
9. limited question relevance;
10. bounded score in `[0,1]` with deterministic behavior.

Ground truth remains the primary anchor. The question is used only as a weak context signal so the evaluator does not overfit to wording in the query.

## Regression benchmark

`track2-benchmark-v2.json` contains 50 internally authored `FRAUD_DETECTION` cases covering exact matches, paraphrases, synonym groups, polarity, direction, numbers, dates, entities, authorization, and adversarial surface-overlap traps.

`track2-tournament.js` runs every high-tier answer against every low-tier answer and fails on any inversion. It also tests exact-zero behavior, long inputs, Unicode and deterministic repeat calls.

The current local v7 binary produces **0 ordering inversions across 56 high-vs-low pairwise comparisons** in this internal corpus. This is a regression result only; it does not reveal Telegraph's hidden benchmark.

## CI release gate

`.github/workflows/track2-final-verify.yml` now builds v7 and gates publication on:

- freestanding wasm32 build;
- WASM validation;
- <=32 MB binary;
- zero imports;
- official `telegraph-wasm-check` in strict mode;
- 50-case Veridex tournament;
- empty/whitespace/degenerate cases;
- long input;
- Unicode input;
- deterministic repeated calls.

The workflow only publishes the candidate binary after those checks pass.

## Why previous candidates could not beat the leaders

The 14/15 result shows that structural correctness was achieved but one Stage 2 ordering decision remained wrong. The earlier scorer's limited lexical/semantic representation could not robustly distinguish all hidden answer pairs. The supplied leaders' much larger common data segment is strong evidence that they have substantially richer precomputed representation than our original tiny rule engine.

The response is not to make the file large for its own sake. The response is to add more useful representational capacity while preserving sandbox compatibility and deterministic ordinal scoring.

## Final path to on-chain competition

`v7 source -> CI green -> published v7 WASM -> fresh Telegraph registration -> pending -> active/rejected -> inspect Stage 2 metrics -> only if active submit Track 2`

A rejected registration is never reused. A changed binary always receives a fresh registration because the registration is bound to the exact uploaded bytes/hash.

## Winning posture

We should optimize for:

- fewer ranking inversions;
- stronger good-vs-bad margins;
- robust semantic equivalence;
- strong contradiction handling;
- numeric/entity integrity;
- meaningful score variance;
- no regressions on historical failures.

Do not optimize for a particular public score or probe. Telegraph's own guidance warns that passing public probes is not the same as winning the hidden benchmark.

## Current completion state

Completed in repository:

- competitive top-3 binary audit;
- v7 semantic ordinal scorer;
- 50-case ordinal benchmark;
- automated tournament runner;
- CI structural and behavioral release gates;
- updated build documentation and competitive audit.

Still external/undetermined:

- the exact hidden Stage 2 benchmark;
- a fresh on-chain registration of the final candidate;
- whether the final candidate becomes active/champion on Telegraph.

No honest implementation can guarantee first place until the protocol evaluates the final binary.
