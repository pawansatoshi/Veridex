# Veridex Track 2 — FINAL COMPETITIVE BLUEPRINT

Last consolidated: 2026-08-30

## 1. Mission

Build the strongest defensible `FRAUD_DETECTION` Script Author for Telegraph Track 2, while remaining coherent with Veridex's evidence-first contract-intelligence product.

Core objective:

> Maximize the probability of winning the hidden Stage-2 evaluation without overfitting public fixtures, weakening determinism, or misrepresenting provenance.

No local benchmark can prove #1. Only Telegraph's live evaluation can establish competitive position.

## 2. What changed from the older blueprint

The older blueprint correctly moved Veridex from a KB-scale lexical/rule scorer toward the official Telegraph semantic baseline. This final version preserves that decision and adds the lessons discovered during V10 hardening:

- the official baseline is the semantic foundation, not merely a reference;
- Veridex's factual-integrity wrapper must protect high-impact semantic inversions;
- `rank_answer` and `breakdown_answer` must share one authoritative scoring path;
- >65,535-byte safety is a mandatory regression requirement;
- no-dealloc memory behaviour must be tested because the public checker exercises it;
- primary and contract-security tournaments are separate evidence layers;
- public `hard.json` blind spots must be tested without treating them as the hidden benchmark;
- mutation testing is required before release;
- exact binary/hash provenance is part of the release artifact;
- historical V6/V7/V9 candidates remain preserved and are never silently promoted;
- a fresh registration is forbidden until every release gate is green.

## 3. Official/reference foundation

Use the official Telegraph repositories as protocol and implementation references:

- `telegraphprotocol/telegraph-examples` — registration, node interaction, verification and protocol examples.
- `telegraphprotocol/telegraph-wasm-baseline` — official open-source WASM scoring reference and real MiniLM semantic path.

Pinned upstream baseline:

`dfa0cf7fda72789267811ba2190f61a8eaacedf6`

The baseline is MIT licensed. Preserve the upstream notice and provenance. Do not describe upstream MiniLM weights/model implementation as original Veridex work.

## 4. Final evaluator architecture

```text
QUESTION / GROUND TRUTH / MINER ANSWER
                 ↓
        safe bounded input handling
                 ↓
       empty/whitespace hard gates
                 ↓
        normalized exact-match = 1
                 ↓
       official semantic foundation
          MiniLM + BM25 signals
                 ↓
       Veridex factual-integrity layer
                 ├─ polarity / negation
                 ├─ direction / relation
                 ├─ numeric / unit / date
                 ├─ entity preservation
                 ├─ answer-shape relevance
                 └─ contradiction protection
                 ↓
       bounded deterministic base score
                 ↓
       monotonic calibration, if proven
                 ↓
             final [0,1]
```

The semantic foundation provides broad generalization. The Veridex layer exists primarily to prevent high-value factual inversions such as correct-number/wrong-entity, opposite polarity, wrong direction and numeric mutation.

Do not add rules merely because they improve one public fixture. Every rule must be justified by an independent regression class and measured against semantic regressions.

## 5. Track-2 scoring priorities

Priority order:

1. Correct ordinal ranking.
2. Factual integrity.
3. Semantic paraphrase/generalization.
4. Anti-gaming discrimination.
5. Deterministic execution.
6. Runtime/memory safety.
7. Useful score margin.
8. Calibration only where monotonic and demonstrably beneficial.

A higher mean score is not inherently better. A lower inversion count with strong margins is more valuable than cosmetic score magnitude.

## 6. Historical regression requirements

Permanent regression lessons:

- `#1766` — self-match/cross-match failure.
- `#1772` — insufficient separation.
- `#1792` — malformed WASM.
- `#1809` — whitespace-only answer returned approximately `0.0097` instead of exactly `0`.
- `#1818` — approximately `14/15` ordering versus incumbent `15/15`.
- `#1821` — approximately `14/15` ordering versus incumbent `15/15`.

These are historical evidence, not binaries to resubmit.

## 7. Candidate policy

| Candidate | Role | Final decision |
|---|---|---|
| V6 | historical compact scorer | retain for regression |
| V7 | historical compact scorer | retain for regression |
| V9 | independent compact scorer | reject for release because of breakdown/16-bit offset weaknesses |
| Neural hybrid baseline | semantic foundation | use only through reproducible pinned build |
| V10/V10.1 neural hardening | current release candidate | promote only after every gate is green |

The V10 neural-hybrid path is preferred because the observed competitive family and official baseline demonstrate that meaningful semantic representation is valuable. Binary size alone is never an optimization target.

## 8. Benchmark policy

Current `track2-benchmark-v2.json` contains **49 cases**. Older documentation said 50; the file itself is authoritative.

A supplemental `track2-benchmark-contract-v1.json` contains 6 contract-security cases covering authority, evidence, overclaiming and entity-conflict reasoning.

The benchmark corpus should cover:

- exact/normalized match
- paraphrase
- conservative synonym
- partial correct core
- unrelated answer
- contradiction
- negation/polarity
- direction reversal
- wrong entity
- wrong number/unit/date
- surface-overlap trap
- semantic-overlap trap
- capability/evidence/authority/security/fraud terminology
- question-context mismatch
- Unicode/CJK/emoji/accented input
- long input

The benchmark is a regression instrument, not the hidden Stage-2 benchmark. It must not be optimized blindly.

## 9. Differential baseline testing

Where tooling permits, compare Veridex against the official baseline/reference behaviour.

Record:

- candidate wins
- candidate regressions
- ordering agreement
- resolved blind spots
- new semantic failures
- margin changes

The objective is not to beat the baseline on every handcrafted rule. The objective is to improve useful ranking while preserving its broad semantic capacity.

## 10. Tournament requirements

Every candidate must produce:

- total cases
- pair count
- wins/losses/ties
- inversions
- mean margin
- median margin
- worst margin
- best margin
- self-match score
- score standard deviation
- invalid-score count
- deterministic repeatability
- runtime
- memory behaviour

Every inversion must include the question, ground truth, high answer, low answer, both scores, component values and likely failure mode.

No blind weight tuning.

## 11. Mutation suite

Before release, mutate good answers to create adversarial negatives:

- entity swap
- number mutation
- unit mutation
- date mutation
- polarity flip
- direction flip
- authority substitution
- irrelevant insertion
- surface-overlap deception
- incomplete answer
- long-answer padding

The mutation suite must test that a superficially similar but factually wrong answer does not systematically outrank the correct answer.

## 12. Hard release gates

Required exports:

- `memory`
- `alloc`
- `dealloc`
- `rank_answer`
- `breakdown_answer`

Required runtime properties:

- zero imports
- no WASI/network/filesystem dependency
- valid WASM
- <=32 MiB binary
- empty answer exactly `0`
- whitespace-only answer exactly `0`
- empty ground truth safely handled
- exact normalized match exactly `1`
- finite scores in `[0,1]`
- deterministic repeat calls
- deterministic fresh-instance calls
- long input safe
- >65,535-byte input safe
- UTF-8/CJK/emoji/accented input safe
- embedded NUL safe
- allocator/pointer bounds safe
- no memory corruption
- breakdown final equals `rank_answer`
- no stale/uninitialized breakdown state

## 13. Runtime budget

The current team clarification indicates a **10-minute hard evaluation budget per module**. Treat this as a release-critical constraint even though exact hidden evaluation mechanics remain undisclosed.

Therefore the engineering target is:

`semantic capacity + factual discrimination + bounded runtime`

not maximum model complexity.

Benchmark both cold and warm/repeated behaviour. Memory growth under no-dealloc conditions must be bounded enough to survive the public checker and realistic validator usage.

## 14. Breakdown ABI

There is exactly one scoring implementation.

`rank_answer` and `breakdown_answer` both use it.

Breakdown layout:

`[base_semantic, factual_guard, question_guard, calibrated, final]`

The fifth value must equal the final `rank_answer` result. Empty/whitespace/empty-ground-truth cases must return five zero values.

Any ABI disagreement is a release blocker.

## 15. Calibration

Calibration is optional.

It is permitted only when:

- monotonic;
- deterministic;
- bounded;
- reproducible;
- endpoint-safe;
- does not introduce inversions;
- improves measured separation without degrading rank quality.

Never use calibration to conceal poor ordering.

## 16. Reproducible release pipeline

```text
SOURCE
  ↓
PINNED BUILD
  ↓
WASM VALIDATION
  ↓
EXPORT / IMPORT / SIZE GATES
  ↓
EDGE + ABI PREFLIGHT
  ↓
PRIMARY TOURNAMENT
  ↓
CONTRACT-SECURITY TOURNAMENT
  ↓
MUTATION SUITE
  ↓
PUBLIC hard.json CHECK
  ↓
PUBLIC WAZERO STRICT CHECK
  ↓
SHA-256 + PROVENANCE
  ↓
FREEZE EXACT BYTES
  ↓
FRESH TELEGRAPH REGISTRATION
  ↓
WAIT FOR ACTIVE / REJECTED
  ↓
INSPECT LIVE RESULT
  ↓
ONLY THEN SUBMIT EXACT ACCEPTED ARTIFACT
```

**No green gate → no registration.**

## 17. Registration discipline

A registration identifies exact uploaded bytes/hash. Any changed binary requires a new registration.

Never:

- register a speculative candidate;
- alter bytes after registration;
- interpret `pending` as acceptance;
- reuse a rejected registration for changed bytes;
- submit the Hackathon form before acceptance/live evidence.

## 18. Three-track coherence

Track 1 produces evidence-backed smart-contract capability intelligence.

Track 2 evaluates whether answers preserve that intelligence accurately and resist factual/semantic gaming.

Track 3 presents that intelligence as a useful contract-analysis product.

The Track 2 benchmark should therefore include evidence, authority, capability and security semantics without turning the evaluator into an unrelated NLP demo.

## 19. Definition of done

Track 2 is release-ready only after:

1. exact source is pinned;
2. exact binary is reproducibly built;
3. all local gates pass;
4. all CI gates pass;
5. public checker passes;
6. SHA-256 is recorded;
7. exact artifact is frozen;
8. fresh Telegraph registration is accepted/active;
9. live Stage-2 result is recorded;
10. exact accepted artifact is submitted.

Only item 9 can establish the actual competitive result. Until then the correct status is validation pending.
