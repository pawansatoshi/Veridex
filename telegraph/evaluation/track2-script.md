# Veridex — Telegraph Track 2 Script Author

## Intent

**Intent:** `smart-contract-risk`

Veridex evaluates smart-contract capability intelligence. The evaluator is designed to distinguish:

- ownership/control capability
- upgradeability
- pause capability
- mint/supply authority

The core principle is **evidence before interpretation**: a capability may only be asserted when the underlying evidence supports it. Unknown, unavailable, or inconclusive evidence must not be converted into a negative answer.

## Evaluation contract

The script consumes a Miner answer and deterministic ground-truth evidence for the same contract observation. It scores the answer component-by-component rather than rewarding a single aggregate label.

### Canonical fields

```json
{
  "ownership": "active | not_detected | unknown",
  "upgradeability": "active | not_detected | unknown",
  "pause": "active | not_detected | unknown",
  "mint": "active | not_detected | unknown"
}
```

Optional evidence metadata may include `method`, `source`, `confidence`, `verified`, and `authority`.

## Scoring philosophy

1. Exact capability agreement is rewarded.
2. An `unknown` answer is preferred over an unsupported negative when ground truth is unavailable.
3. Unsupported certainty is penalized.
4. Evidence-backed answers receive a quality bonus only when the evidence metadata is internally consistent with the answer.
5. Malformed output receives a deterministic low score rather than causing validator failure.
6. Extra fields never override canonical fields.
7. Scores are bounded to `[0, 1]` and contain no randomness, wall-clock dependence, network calls, or external mutable state.

## Why this is harder to game

A Miner cannot maximize its score by returning four static booleans. Each capability is evaluated independently, and confidence/evidence claims are checked against the canonical observation. Conservative uncertainty is explicitly distinguished from a false negative. The evaluator also rejects malformed JSON and impossible enum values deterministically.

## Reproducibility

The canonical evaluator has no network access and no dependency on current time. Given identical Miner output and ground truth, every validator obtains the same score.

## Local verification

The repository's existing evaluator and verification scripts remain the source of truth for development and benchmarking. This Track 2 artifact documents the evaluation contract and provides the deterministic WASM-facing implementation under `telegraph/evaluation/`.
