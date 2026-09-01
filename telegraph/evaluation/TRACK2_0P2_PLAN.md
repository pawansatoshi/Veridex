# Track 2 0.2+ Promotion Plan

## Objective

Raise the live `FRAUD_DETECTION` registration margin from the current observed
~0.1405 baseline to **0.20+**, while preserving deterministic WASM behavior,
public compatibility, and resistance to obvious gaming.

This branch is intentionally forked from the known-good 14.0 candidate at
`5067e6182c70780c38cae6798eaa88299a78b37d`. The original artifact path and
source remain untouched on the existing branch/history.

## Frozen baseline

The 14.0 CI run (`33451318400`) built successfully and recorded:

- exact release source checkout: `5067e6182c70780c38cae6798eaa88299a78b37d`
- WASM size: 24,194,817 bytes
- primary ordering: 55/55, zero inversions
- contract ordering: 6/6, zero inversions
- mutation suite: 157/157, zero failures
- live-risk local stress: 259 pairs, zero inversions, mean margin 0.7621
- pinned public Wazero checker: passed
- artifact SHA-256: `4735e521815a999f83aa27fa1268d4dbceb50935dadc6f91485fe3a85238cd6a`

These are **local/public gates only**; they do not imply a private Telegraph
promotion result.

## Change policy

Do not use another lab/release-doctor branch as the default path.

Each iteration must be a small derivative of 14.0 and satisfy this order:

1. one general scorer change;
2. local correctness and mutation gates;
3. public Wazero compatibility;
4. fresh live registration;
5. compare live margin against 0.1405 and the 0.20 target;
6. keep the change only when it improves live evidence without regressing gates.

No hidden-benchmark literals, answer memorization, or benchmark-specific
question matching is allowed.

## 0.2 candidate change

The first derivative adds a **bounded consistency credit** to the existing
14.0 scorer. It detects agreement between ground truth and answer on one of
three already-general semantic rails:

- binary polarity for binary questions;
- predicate polarity (safe/unsafe, legitimate/fraudulent, approved/rejected,
etc.);
- directional polarity (increase/decrease, rise/fall, higher/lower, etc.).

When at least one rail agrees and the existing contradiction/entity/numeric
checks do not reject the answer, a moderate monotone calibration lifts the
base score from `base` toward `0.35 + 0.65*base`, capped at `0.98`. Numeric
exact-equivalence keeps the stronger existing normalized-equivalence path.

The intent is to improve true semantic paraphrase recall without weakening
conflict rejection. The implementation lives in
`build_candidate_fast_release_0p2.py` and composes the frozen 14.0 release
wrapper rather than editing it in place.

## Promotion gates

### Mandatory local/public gates

- WASM validates and has zero imports.
- ABI exports remain intact.
- primary tournament: zero inversions;
- contract tournament: zero inversions;
- mutation suite: zero failures;
- live-risk stress: zero inversions, mean margin >= 0.20, p10 margin >= 0.05;
- pinned public Wazero checker: hard failures = 0;
- deterministic repeat and fresh-instance checks remain true;
- no score outside `[0,1]` and no NaN/Inf.

### Live promotion target

**Primary success condition: fresh Telegraph registration average margin >=
0.20.**

A value in `0.15 <= margin < 0.20` is treated as an intermediate result, not
a finished candidate. A regression below the best known live result is rejected.

## Iteration strategy after 0.2 candidate

If the first derivative remains below 0.20 live, the next change should target
the largest empirically identified hidden weakness, preferably one of:

1. semantic paraphrase calibration where the candidate is correct but scores
   materially below the champion;
2. multi-field factual consistency (numbers/entities/relations) where the
   answer is semantically similar but factually wrong;
3. negation/direction composition where explicit polarity and sentence-level
   meaning disagree.

Only one of these is changed per iteration so the live result remains
attributable.

## Decision ledger

| Stage | Candidate | Local gates | Live margin | Decision |
|---|---|---|---:|---|
| Frozen | 14.0 / `5067e618` | Pass | ~0.1405 observed on prior live registration | Baseline |
| 1 | `0p2` consistency-credit derivative | Pending CI | Pending | Evaluate |

## Operational rule

Never replace the known-good 14.0 artifact with a derivative until the
**fresh live registration** demonstrates the improvement. The branch and build
outputs must remain reproducible from committed source.