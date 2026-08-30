# Veridex Agent Operating Contract

This file is mandatory context for every coding agent working on Veridex.

## Mission

Build Veridex into a winning Telegraph Miner and durable verifiable on-chain intelligence product. Optimize for measurable quality, deterministic correctness, low latency, resilience, evidence provenance, developer utility, and excellent product experience.

## First Read

Before making changes, read:

1. `VERIDEX_HACKATHON_MASTER_CONTEXT_V2.md` — current hackathon/three-track context
2. `PROJECT_STATE.md`
3. `CLAUDE.md`
4. `docs/ARCHITECTURE.md`
5. `docs/ROADMAP.md`
6. `docs/DECISIONS.md`
7. `docs/EVALUATION.md`
8. `telegraph/evaluation/BUILD.md`
9. `telegraph/evaluation/TRACK2_BLUEPRINT.md`
10. `telegraph/evaluation/TRACK2_RELEASE_BLUEPRINT.md`
11. `telegraph/evaluation/neural/README.md`
12. `.github/workflows/track2-final-verify.yml`

Then inspect the actual repository. Never rely on memory or an earlier chat as proof that code exists.

## Source-of-Truth Policy

For Telegraph-specific facts:

- official docs first
- official hackathon rules second
- official supported intents third
- official Telegraph repositories/use cases fourth
- external sources only when necessary and explicitly labeled.

Never invent contract addresses, ABI fragments, selectors, storage slots, intent schemas, Miner configuration, payment requirements, or evaluation semantics.

## Engineering Rules

- deterministic evidence before probabilistic interpretation
- stronger evidence before weaker heuristics
- proxy-aware by design
- preserve proxy storage semantics for live calls
- distinguish implementation code from proxy state
- infrastructure failure must never masquerade as a contract finding
- every fallback must be observable
- malformed external data must fail safely
- every behavior change gets regression tests
- keep domain logic independent from infrastructure implementations where practical
- do not add dependencies without a measured reason
- do not refactor unrelated code
- do not change accepted decisions silently
- do not alter confidence numbers without an explicit evaluation reason
- never hardcode unverified real-world contract addresses
- never claim Track 2 is #1 without live Telegraph evidence
- never hide upstream provenance or license obligations

## Track 2 Release Contract

For Track 2, the mandatory path is:

`inspect → build → wasm-validate → zero-import/size gate → preflight → tournament → adversarial mutation suite → official Wazero checker → hash/provenance → fresh registration → live evaluation → exact submission`

A `pending` registration is not acceptance. A changed binary requires a fresh registration. A local benchmark pass is not proof of hidden Stage-2 promotion.

## Autonomous Workflow

Think and act as a senior engineer:

`inspect → model → verify → implement smallest correct change → test → typecheck → review → update docs/state`

Do not ask the user which file to edit or which test to write when the repository and architecture make the decision clear.

Stop at a meaningful milestone and report:

- what changed
- why
- evidence/assumptions
- tests
- typecheck
- remaining risk
- next milestone.

## Phase Discipline

Only work on the current phase unless another change is necessary to unblock correctness or security. Do not build a future subsystem early merely because it is interesting.

## UI/UX Discipline

The product UI is not decoration. It must communicate:

`what was checked → what evidence was found → where the evidence came from → how confident the system is → what the user should understand next`.

Animations must explain state transitions, never hide latency or fabricate certainty.

## Continuity

After each meaningful milestone, update:

- `PROJECT_STATE.md`
- relevant phase document
- `docs/DECISIONS.md` if a durable architectural decision was made
- `docs/EVALUATION.md` when verification/benchmark state changes
- `docs/TELEGRAPH_REFERENCE.md` if protocol facts changed
- `VERIDEX_HACKATHON_MASTER_CONTEXT_V2.md` when hackathon architecture/status changes.

This ensures a new chat or agent can continue without reconstructing history.
