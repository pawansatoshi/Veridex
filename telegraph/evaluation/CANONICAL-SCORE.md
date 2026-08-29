# Canonical Score

For each of the four canonical capabilities, assign:

- `1.0` — exact match
- `0.0` — explicit contradiction
- `0.5` — `unknown` against an unresolved/unknown ground-truth state
- `0.25` — unsupported certainty where the evidence state is unresolved

The four component scores are averaged. A valid, internally consistent evidence report may receive a bounded quality adjustment, but the final score can never exceed `1.0`.

This structure intentionally prevents one easy capability from masking a materially wrong claim on another capability.
