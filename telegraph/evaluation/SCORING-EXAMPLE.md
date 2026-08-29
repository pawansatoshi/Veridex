# Example

Ground truth:

```json
{"ownership":"active","upgradeability":"active","pause":"not_detected","mint":"not_detected"}
```

Miner A returns the same four states: all four components are correct and receives the maximum base score.

Miner B claims `mint: active`: one component contradicts ground truth, so the score falls materially even if the other three fields are correct.

Miner C returns `unknown` for an unavailable capability: this is treated as uncertainty, not as a false negative.

This is the central Veridex distinction: **capability detection and evidence quality are scored separately from security verdicts.**
