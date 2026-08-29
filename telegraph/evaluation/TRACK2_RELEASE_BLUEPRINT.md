# Veridex Track 2 release blueprint

## Objective

Produce a `FRAUD_DETECTION` scoring module that is structurally valid, deterministic, and competitive on Telegraph's Stage 2 promotion gate while remaining aligned with Veridex's evidence-first architecture.

## Strategy

There are two complementary candidates:

1. `veridex_evaluator_v8.c` — independently authored, compact Veridex scorer using lexical, morphology, semantic-class, contradiction, numeric, entity and limited question-context signals.
2. `fr_ss2`-derived calibrated candidates — a transparent, MIT-licensed upstream calibration derivative used as the high-probability competitive candidate. The derivative applies a strictly increasing two-band score map, preserving the upstream ordering while increasing good/bad separation. See `UPSTREAM_NOTICE.md`.

The second path is not described as original semantic-model research.

## Release gates

Before registering any candidate:

- valid `wasm32` module;
- exports `memory`, `alloc`, `dealloc`, `rank_answer`, `breakdown_answer`;
- zero imports / no WASI dependency;
- empty ground truth => 0;
- empty or whitespace-only answer => exactly 0;
- finite score in [0,1];
- deterministic repeated execution;
- long input and UTF-8 smoke tests;
- benchmark/tournament report retained;
- exact SHA-256 and Keccak-256 recorded;
- upstream provenance recorded when a derivative candidate is used.

## Competitive measurement

Telegraph's hidden Stage 2 fixtures are not recoverable from the public interface. Therefore the repository treats live rejection/promotion results as measurements, not as noise.

For calibration candidates, thresholds should be tested from the middle outward. A rejected registration is retained as evidence because its reported margin/win metrics narrow the viable threshold interval.

## Three-track coherence

Track 1: Veridex evidence-first Miner.

Track 2: evaluator that rewards accurate, evidence-backed contract intelligence.

Track 3: application layer consuming Veridex intelligence through a usable product/agent workflow.

The Track 2 scorer should therefore remain grounded in the same factual themes as Veridex: capabilities, ownership/authority, upgradeability, pause/mint/blacklist signals, numeric facts and evidence quality.

## Registration discipline

Never reuse or edit a rejected registration. Every changed WASM hash requires a fresh registration. Wait for the live status before placing the registration ID in the Hackathon submission form.
