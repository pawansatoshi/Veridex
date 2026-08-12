# Veridex — Claude Code Context

Read `PROJECT_STATE.md` and `AGENTS.md` before doing any work.

## Product

Veridex = **Verifiable On-Chain Intelligence**.

It is intended to become a deterministic, auditable smart-contract intelligence Miner for Telegraph Protocol, with a polished application layer.

## Core Thesis

Veridex should convert contract observations into machine-grade signals whose provenance can be inspected. The product must prefer evidence over explanation and correctness over hype.

## Existing Historical Design Lessons

The previous Sentinel work established important lessons, but its code is not automatically present in this repository. Preserve the lessons while verifying implementation from the current tree:

- verified ABI/source > selector heuristics
- EVM instruction-aligned bytecode scanning only
- malformed bytecode returns structured errors
- RPC reverts are application outcomes, not transport failures
- Etherscan unverified / unconfigured / API failure must remain distinguishable
- proxy implementation code and proxy live storage are different concerns
- beacon slot points to a beacon contract, not directly to an implementation

## Telegraph

Use `docs/TELEGRAPH_REFERENCE.md` for verified protocol facts. Re-check official docs when facts may have changed.

The hackathon is performance-driven: current rules state 75% normalized performance within the chosen Intent and 25% X engagement/transparency. Real demand and live operation matter. Do not game metrics.

## Architecture Intent

```text
User / Agent
     │
     ▼
Telegraph Intent
     │
     ▼
Veridex Miner
     │
     ├── request validation
     ├── cache / concurrency policy
     ├── analysis orchestration
     │       ├── proxy resolution
     │       ├── implementation resolution
     │       ├── ownership
     │       ├── pause capability
     │       ├── mint capability
     │       └── future deterministic checks
     │
     ├── evidence normalization
     └── response

Separate product layer:

Web UI → Veridex API/Miner → evidence graph → human-readable report
```

## UX Principle

The visual system should animate real analysis events: address intake, proxy resolution, implementation discovery, ABI verification, capability checks, evidence arrival, and final synthesis. Never animate a conclusion before the underlying evidence exists.

## Autonomous Execution

When given a milestone, inspect the repository, reason about the safest implementation, implement it, test it, typecheck it, and update project state. Do not require the user to dictate individual files or commands.

If an external fact cannot be verified, stop that portion safely and record the dependency rather than fabricating it.
