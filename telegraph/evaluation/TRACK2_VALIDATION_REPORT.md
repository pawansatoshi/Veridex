# Track 2 Validation Report

## Release status

**Status: VALIDATION PENDING — NO NEW REGISTRATION**

This report is evidence-driven. No hidden-benchmark result is inferred from local fixtures.

## Candidate identity

- Source line: `telegraph/evaluation/neural/build_candidate.py` + `build_candidate_compat.py` + `build_candidate_fast.py`
- Pinned upstream baseline: `telegraphprotocol/telegraph-wasm-baseline`
- Upstream commit: `dfa0cf7fda72789267811ba2190f61a8eaacedf6`
- Candidate branch: `track2-v10-hardening`
- Current head: `f5719cae0e00d916da13d6f23fca8d3ea24da283`
- Current fast builder commit: subsequent source changes are tracked by the branch head and must be rebuilt before release
- Exact WASM: generated per CI run; not frozen until all gates pass
- SHA-256: `PENDING_GREEN_CI`

## Live Telegraph result — registration #2084

Registration #2084 for `FRAUD_DETECTION` was rejected by Telegraph because the evaluation fixture gate exceeded the hard time budget:

`evaluation exceeded its time budget: the fixture gate did not complete in time (10m40s elapsed, including module load).`

Interpretation: this was a **live runtime/performance rejection**, not a proof of poor hidden-benchmark ordering. Therefore every future candidate must satisfy both local quality gates and live execution-budget constraints.

## Latest verified CI evidence before the current source edit

GitHub Actions run #124 for the previous fast candidate produced:

- WASM: **24,194,340 bytes**
- imports: **0**
- build: pass
- structural validation: pass
- primary preflight: **3 inversions / 55 pairs**
- self-match: **1.0**
- score stddev: **0.4222**

The three inversions were explicit semantic-equivalence cases:

1. `What was the reported loss?` — ground truth contains `$4.2 million`; `same value` scored below `wrong value`.
2. `What was the loss?` — ground truth `$2.5 million`; `equivalent` scored below `wrong value`.
3. `What was the transaction value?` — ground truth `$1.25 billion`; `equivalent` scored below `wrong value`.

Root cause: the equivalence guard was conditioned on `vr_question_requires_number()`, which does not necessarily classify questions such as `What was the loss?` and `What was the transaction value?` as numeric-answer questions.

## Current corrective change

The fast builder now defines a broader, conservative numeric-context detector covering factual quantity/value terms such as:

`amount, value, loss, profit, revenue, cost, price, fee, number, total, volume, rate, percentage, percent, worth, valuation, supply, balance, quantity`

Explicit equivalence is only considered when all of the following hold:

1. the question contains a numeric-context term;
2. the ground truth contains an extractable numeric fact;
3. the miner answer contains an explicit equivalence phrase;
4. the answer does not contain explicit contradiction/difference markers.

The branch deliberately avoids an unconditional `equivalent -> high score` rule.

## Performance path

The candidate uses a bounded fast neural path:

- `MAX_SEQ_LEN = 64`;
- maximum transformer layers executed = `5`;
- real MiniLM/BM25 semantic foundation from the pinned MIT baseline;
- Veridex factual-integrity wrapper remains deterministic and zero-import.

This is a performance hypothesis that still requires live proof. The Telegraph registration #2084 failure establishes that local success is insufficient if the live fixture gate exceeds its hard time budget.

## Required release evidence

A release candidate must have all of the following for the exact same source/binary:

- build success;
- valid WASM;
- required exports;
- zero imports / no WASI;
- empty/whitespace answer exactly `0`;
- exact normalized answer exactly `1`;
- finite scores in `[0,1]`;
- deterministic repeated and fresh-instance execution;
- long/UTF-8/CJK/emoji/accent/NUL safety;
- zero local ordering inversions;
- contract-security ordering gates pass;
- adversarial mutation suite pass;
- strict public Wazero checker pass;
- performance/memory checks pass;
- exact SHA-256 recorded;
- exact artifact preserved.

Only after these pass should a fresh Telegraph registration be created.

## Release discipline

**No green gate → no registration.**

A registration binds the exact submitted bytes/hash. Any source or binary change requires a new build, new hash, and fresh registration. `pending` is not acceptance.

## Evidence classification

- IMPLEMENTED: source change exists in the branch.
- CI VALIDATED: the exact commit has a successful workflow run.
- PUBLIC CHECKER PASSED: strict public Wazero checker passed for the exact artifact.
- REGISTERED: a fresh on-chain registration exists for that exact artifact.
- ACCEPTED BY TELEGRAPH: the registration is accepted/active.
- COMPETITIVE ON LIVE EVALUATION: live Stage-2 evidence exists.
- OFFICIALLY SUBMITTED: the exact accepted artifact/registration is used in the submission form.

## Current decision

**DO NOT REGISTER the preflight-3-inversion artifact.**

The current source change must first clear the primary preflight, then the complete release pipeline. No conclusion about #1 is valid until Telegraph's independent live evaluation provides it.
