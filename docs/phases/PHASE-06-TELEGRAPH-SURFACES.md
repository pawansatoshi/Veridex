# Phase 06 — Telegraph Track Surfaces

## Objective

Separate the three H1 Telegraph tracks into a clear judge-facing information architecture without changing Miner/core behavior.

## Status

**COMPLETE — 06A through 06H implemented at the presentation/documentation layer.**

## Surfaces

- `/telegraph/` — Telegraph hub
- `/telegraph/miner/` — Track 1 Miner
- `/telegraph/evaluation/` — Track 2 Script Author / evaluation
- `/telegraph/application/` — Track 3 Application
- `/passport/` — product capability identity, deliberately not a hackathon track
- `/watch/` — longitudinal product layer; current implementation boundaries remain explicit

## Design rules

- Track pages explain what exists; they do not fabricate metrics.
- Track 1 remains deterministic and evidence-backed.
- Track 2 exposes reproducible evaluation methodology and uses `—` for unverified current measurements.
- Track 3 points to the real application and live Miner consumption.
- Passport and Watch remain product capabilities, not Track 1/2/3 labels.
- No Miner/core analysis implementation is changed by this phase.
- Mobile layouts collapse without relying on fake overflow suppression.
- Reduced-motion behavior is preserved.

## Completion criteria

- Dedicated Track 1 surface exists.
- Dedicated Track 2 surface exists.
- Dedicated Track 3 surface exists.
- Telegraph hub can route to all three.
- Product Passport/Watch remain separately discoverable.
- No unsupported performance/ranking/demand claim is introduced.
- Current verification status remains explicitly distinguished from historical evidence.
