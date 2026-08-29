# Track 2 V9 HANDOFF

**Read this before touching Track 2.**

## Current implementation
`veridex_evaluator_v9.c` is the independent Veridex evaluator. It adds real question-context contribution that v8 did not use: question/ground-truth relevance, numeric-question answer-shape checks, and yes/no answer-shape checks. It retains conservative semantic families, morphology, numeric equivalence, entity-conflict protection and contradiction penalties.

## Why v9 exists
Previous registrations #1809, #1818 and #1821 failed for different reasons. #1809 exposed the exact whitespace-zero hard gate; #1818 and #1821 reached behavioral evaluation but lost 14/15 ordering to the incumbent. Do not repeat blind registrations.

## Current gate
Run:

`node telegraph/evaluation/track2-preflight.js <candidate.wasm> telegraph/evaluation/track2-benchmark-v2.json`

It checks exports, zero imports, empty/whitespace behavior, self-match, high-vs-low ordering, long input, Unicode, NUL, determinism, margin and score variance.

Then run the official Wazero checker where available. **No green gate means no registration.**

## Benchmark
`track2-benchmark-v2.json` contains 50 regression cases. It is a local quality gate, not a substitute for Telegraph's hidden Stage 2 benchmark. Validate that an incumbent also behaves sensibly before using the corpus for optimization.

## Competition strategy
The observed incumbent family is ~24 MB with a large static semantic representation. Early Veridex rule scorers were KB-scale and repeatedly lost ordering. A monotonic calibration can improve separation without changing ordering, but any upstream-derived artifact must have compatible licensing and explicit provenance. Never disguise competitor-derived work as original.

## Three-track coherence
Track 1 produces evidence-backed contract intelligence. Track 2 evaluates the quality of those answers. Track 3 turns that intelligence into Veridex product workflows. Do not optimize Track 2 into an unrelated generic NLP demo.

## Registration sequence
`build → preflight → official checker → hash/provenance → fresh registration → wait → inspect live result → compare incumbent → submit exact accepted artifact`

A pending registration is not proof of acceptance. A changed binary always requires a new registration.

## Status
As of 2026-08-30, v9 is implemented in source and the stricter preflight is implemented. It is **not yet proven #1 or officially submitted as a winning candidate** until a fresh binary passes all gates and Telegraph live evaluation confirms it.
