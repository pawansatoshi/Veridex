# Track 2 — Veridex Evaluation Script

This directory contains the Script Author submission for Telegraph Hackathon Track 2.

## What the script measures

Veridex scores `smart-contract-risk` Miner outputs against deterministic capability ground truth. It evaluates ownership, upgradeability, pause, and mint independently and preserves explicit uncertainty.

## Design goals

- deterministic output
- evidence-first evaluation
- component-level scoring
- malformed-output rejection
- conservative handling of unavailable evidence
- no network or clock dependency
- bounded score in `[0, 1]`

The evaluator is intentionally not a security verdict. It measures how faithfully a Miner reports the capabilities established by the supplied evidence.

See `track2-script.md` for the canonical evaluation contract and the repository's existing evaluation/benchmark scripts for development verification.
