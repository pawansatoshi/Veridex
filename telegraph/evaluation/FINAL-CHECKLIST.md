# Final Track 2 checklist

- Intent is explicitly documented.
- Canonical fields are documented.
- Scoring is bounded to `[0,1]`.
- Unknown/unavailable evidence is not treated as a false negative.
- Malformed output is deterministic.
- No network/time/randomness dependencies.
- Test vectors are committed.
- Freestanding WASM source is committed.
- WASM artifact is compiled for the expected validator ABI.
- Registration acceptance and registration ID are still required before submission.
