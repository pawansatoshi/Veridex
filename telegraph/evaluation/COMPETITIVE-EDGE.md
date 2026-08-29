# Why Veridex is a serious Track 2 candidate

Veridex is intentionally domain-specific rather than a generic string-overlap scorer. It evaluates a structured smart-contract capability report across four independent dimensions and treats evidence failure as uncertainty instead of silently converting it to a negative.

That makes the script useful for downstream agents that need to know not only whether a capability was mentioned, but whether the Miner reached the same evidence-backed state as the canonical observation.

The evaluator is deterministic and componentized so regressions are visible rather than hidden behind a single heuristic score.
