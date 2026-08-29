# Veridex Track 2 — Scorer Blueprint

## Objective

Build the strongest defensible FRAUD_DETECTION scoring module for Telegraph Track 2 without overfitting to published probes.

The target is not merely Stage 1 validity. The candidate must also win the hidden benchmark on ordinal ordering and separation. Telegraph's published guidance describes Stage 2 as a competition against the current champion and reports candidate margin, champion margin, wins and related diagnostics.

## Current observed state

- #1766 rejected: self-match failed against unrelated cross-match.
- #1772 rejected: lost to champion on separation.
- #1792 rejected: malformed WASM code section.
- #1809 rejected: whitespace answer scored 0.0097 instead of exactly 0.
- #1818 rejected: 14/15 benchmark ordering wins versus champion 15/15.
- #1821 rejected: 14/15 benchmark ordering wins versus champion 15/15.

These are regression cases, not candidates for resubmission.

## Architecture

`rank_answer(question, ground_truth, miner_answer)` is deterministic and freestanding wasm32 with no imports.

The score combines:

1. normalized exact token equality;
2. semantic-class coverage for conservative closed-set concepts;
3. lexical precision/recall and adjacent phrase overlap;
4. numeric-value equivalence, including comma/underscore separators and k/m/b suffixes;
5. conservative entity-conflict detection;
6. explicit contradiction penalties for polarity/direction pairs;
7. bounded answer-length contribution.

Ground truth remains the primary semantic anchor. The question is accepted by the ABI but is intentionally not allowed to dominate scoring.

## Hard pre-registration gate

Every candidate must pass before any new on-chain registration:

- `wasm-validate` passes;
- no WASI/OS/network imports;
- required exports: `memory`, `alloc`, `dealloc`, `rank_answer`, `breakdown_answer`;
- empty and whitespace-only miner answers return exactly `0`;
- correct self-match strictly exceeds unrelated cross-match;
- valid finite score in `[0,1]`;
- no trap on long, Unicode, malformed or degenerate inputs;
- deterministic across repeat calls and fresh module instances;
- official `telegraph-wasm-check` passes with `--strict` and the Veridex ordering corpus.

## Intent corpus

`fraud-detection-cases.json` is an ordinal corpus covering:

- exact labels;
- semantic equivalents;
- polarity/antonym traps;
- contradiction/direction flips;
- numeric paraphrases and unit changes;
- wrong-entity answers;
- yes/no and authorization labels.

Assertions are ordinal. They do not claim a particular absolute score threshold.

## Anti-overfitting policy

Do not tune only to public blind-spot examples. For every published probe, add a transformed companion that changes surface form while preserving the intended relationship.

Use held-out local cases for final tuning. Prefer improvements that generalize across multiple case families rather than fixes targeted to one example.

## Registration policy

A binary may be registered only when the complete pre-registration gate is green. After registration, wait for registry indexing and inspect the live status. A rejected candidate is never submitted again; a changed binary receives a new registration because Telegraph binds a registration to the exact uploaded bytes/hash.

## Winning criteria

Success means:

- Stage 1 clean;
- no hidden benchmark structural failure;
- candidate wins at least as many benchmark cases as the champion;
- candidate margin is stronger than the champion where possible;
- score spread remains meaningful;
- no known regression from the historical failures above.

A first-place result cannot be guaranteed because the full hidden benchmark and incumbent implementation are not public. The engineering objective is to maximize generalization, not to game published probes.
