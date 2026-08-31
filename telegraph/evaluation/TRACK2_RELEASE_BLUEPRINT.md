# Veridex Track 2 — FINAL RELEASE BLUEPRINT

Last consolidated: 2026-08-30

This document supersedes older Track-2 release plans where they conflict. Historical candidate files and evidence remain preserved.

## Objective

Release the strongest defensible `FRAUD_DETECTION` Script Author for Telegraph Track 2, maximizing the probability of beating the incumbent on hidden Stage 2 while maintaining deterministic WASM safety, semantic generalization, factual integrity, reproducibility and clean provenance.

No local benchmark can establish #1. Only Telegraph live evaluation can establish the final competitive result.

## Final candidate decision

**Primary release line:** neural-hybrid V10.1

**Semantic foundation:** pinned official Telegraph WASM baseline, MIT licensed, commit `dfa0cf7fda72789267811ba2190f61a8eaacedf6`.

**Veridex contribution:** independently authored wrapper/integrity logic, integration, release gates, diagnostics and product coherence.

**Fallback/reference:** V6/V7/V9 compact candidates remain preserved. V9 is explicitly rejected for release because its historical implementation had a nonfunctional breakdown path and 16-bit token-offset limitations.

## Scoring stack

`safe input → empty hard-zero → normalized exact match → MiniLM/BM25 semantic signals → factual guards → question/answer-shape guards → bounded score → monotonic calibration only if independently proven`

Factual guards cover:

- contradiction/polarity;
- negation;
- direction/relation changes;
- numeric/value/unit/date mutation;
- entity conflict;
- numeric-question shape;
- unambiguous binary answer shape.

The semantic model remains responsible for broad paraphrase/generalization. Rules are guardrails, not a replacement for semantic representation.

## Official/reference repositories

The engineering process uses:

- `telegraphprotocol/telegraph-examples` for protocol, registration, node and verification flow;
- `telegraphprotocol/telegraph-wasm-baseline` for the official semantic WASM reference and reproducible MiniLM/BM25 foundation;
- the pinned public Wazero compatibility checker for independent runtime validation.

External source code/weights remain explicitly attributed and license-compatible. No competitor binary/code/weights are presented as original Veridex work.

## Benchmark and differential evaluation

Primary local benchmark: `track2-benchmark-v2.json` — **49 cases in the current source file**. Older documentation claiming 50 is stale.

Supplemental contract-security benchmark: `track2-benchmark-contract-v1.json` — 6 cases.

The tournament must report:

- total cases/pairs;
- wins/losses/ties;
- inversions;
- mean/median/worst/best margin;
- self-match;
- standard deviation/spread;
- invalid scores;
- repeat/fresh determinism;
- runtime and memory behaviour;
- per-inversion component diagnostics.

Where tooling permits, compare against the official baseline and record both improvements and regressions. Do not optimize to a public fixture in isolation.

## Adversarial mutation coverage

Required mutation classes include entity swap, numeric mutation, unit/date mutation, polarity/direction flip, authority substitution, irrelevant insertion, surface-overlap deception, incomplete answers and long-answer padding.

A candidate must not systematically reward factually corrupted answers merely because they preserve keywords.

## Hard gates

Before registration all must pass:

- valid WASM;
- required exports: `memory`, `alloc`, `dealloc`, `rank_answer`, `breakdown_answer`;
- zero imports;
- no WASI/network/filesystem dependency;
- empty answer exactly `0`;
- whitespace-only exactly `0`;
- empty ground truth safely handled;
- exact normalized answer exactly `1`;
- finite scores in `[0,1]`;
- repeated and fresh-instance deterministic execution;
- >65,535-byte input safety;
- UTF-8/CJK/emoji/accent safety;
- embedded NUL safety;
- pointer/allocator safety;
- breakdown final equals `rank_answer`;
- binary <=32 MiB;
- no unacceptable local ordering inversion;
- meaningful score distribution;
- mutation suite green;
- strict public Wazero checker green.

## Runtime budget

Current team clarification indicates a hard **10-minute evaluation budget per module**. Treat this as release-critical. Benchmark cold start, warm calls, repeated scoring and memory growth. Prefer bounded execution and compact host interaction without reducing semantic quality.

## Breakdown ABI

`rank_answer` and `breakdown_answer` must call the same authoritative score function.

Breakdown layout:

`[base_semantic, factual_guard, question_guard, calibrated, final]`

The final slot must equal `rank_answer` exactly within the release contract. Empty/whitespace/empty-GT paths must return zeroed breakdown values.

## Release pipeline

```text
source
 → reproducible build
 → wasm-validate
 → exports/imports/size
 → hard preflight
 → primary tournament
 → contract-security tournament
 → mutation suite
 → public hard.json checks
 → strict public Wazero checker
 → SHA-256 + provenance
 → freeze exact bytes
 → fresh Telegraph registration
 → wait for active/rejected
 → inspect live Stage-2 result
 → submit exact accepted artifact
```

**NO GREEN GATE → NO REGISTRATION.**

## Registration discipline

A registration is tied to the exact submitted artifact/hash. If source or bytes change, create a new binary/hash and fresh registration. `pending` is not acceptance.

Never modify registered bytes. Never reuse rejected registrations for changed artifacts.

## Competitive interpretation

Historical `15/15` versus `14/15` results are treated as an ordinal diagnostic lesson, not the complete leaderboard formula. The actual hidden Stage-2 fixture set is not reconstructed from those historical numbers.

The optimization target is robust ordering across unseen answer styles:

`correct semantic/factual answer > partial/correct-core > unrelated > contradictory/wrong-entity/wrong-number`

subject to the actual Telegraph evaluator.

## Completion definition

Track 2 is complete only when:

1. source is pinned;
2. exact binary is reproducibly built;
3. all local/CI gates are green;
4. public checker passes;
5. SHA-256 is recorded;
6. exact bytes are frozen;
7. fresh Telegraph registration is accepted/active;
8. live Stage-2 result is recorded;
9. exact accepted artifact/registration is submitted.

Until step 8, status is **validation/acceptance pending**, not #1.
