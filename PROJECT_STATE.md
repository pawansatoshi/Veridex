# Veridex — Persistent Project State

> **Single source of truth for continuation across chats, agents, IDEs, and sessions.**
>
> Last reviewed: 2026-08-13

## Mission

Build **Veridex — Verifiable On-Chain Intelligence** into a production-grade, deterministic-first Telegraph Miner that can compete on canonical performance, serve real applications, and remain extensible for future Telegraph hackathons and mainnet.

Veridex is a real product, not a disposable hackathon demo. Engineering decisions must optimize for correctness, evaluation alignment, performance, real utility, UX, differentiation, and long-term extensibility in that order.

## Operating ownership

The project is now built and directed directly in this repository. Do not assume Claude Code or another external agent is the project owner. Any future agent must read this file and the repository instructions before acting.

## Current status

**Stage: Phase 01 — EVM Analysis Core**

Repository: `pawansatoshi/Veridex`
Default branch: `main`
Visibility: public

Phase 00 is complete. Phase 01 is the current implementation milestone.

The repository was created as a clean Veridex codebase. Earlier Sentinel work is architectural prior art only; never claim historical test counts or modules exist here unless verified in GitHub.

## Accepted product decisions

- Product name: **Veridex**
- Positioning: **Verifiable On-Chain Intelligence**
- Deterministic evidence is the core product principle.
- Proxy-aware analysis is mandatory.
- Verified ABI/source evidence is preferred over selector heuristics.
- Bytecode scanning is fallback evidence, never stronger than verified evidence.
- Infrastructure failures must not become false contract signals.
- Every fallback/degradation path must be observable.
- Domain checks remain independently testable.
- Telegraph integration remains separated from core analysis logic.
- Shared result/evidence fields are additive and provenance-aware.
- Scoring is deferred until the actual Telegraph Intent/evaluation contract requires it.
- Beacon proxy resolution is explicit; a beacon address is not an implementation address.
- Evaluation code remains independent from production analysis logic.
- UI consumes backend truth and visualizes real analysis events.

## Historical Sentinel lessons to preserve

These lessons are prior art, not proof of current Veridex implementation:

1. Selector clashing makes bytecode selector detection weaker than verified ABI/source evidence.
2. Bytecode scanners must walk actual EVM instruction boundaries; arbitrary byte scanning can false-positive inside PUSH operands.
3. Malformed bytecode must become structured error evidence rather than crash a check.
4. Etherscan/API failure, unverified contract, and missing configuration are distinct states.
5. RPC JSON-RPC reverts are application-level outcomes, not infrastructure outages.
6. Delegatecall proxies require implementation code/ABI inspection while live state remains in proxy storage context.
7. Beacon detection is not implementation resolution; the beacon's implementation interface must be called before capability inspection.

## Official Telegraph reference hierarchy

Use sources in this order:

1. `https://docs.telegraphprotocol.com/docs`
2. `https://hackathon.telegraphprotocol.com/rules`
3. `https://hackathon.telegraphprotocol.com/supported-intents`
4. `https://github.com/telegraphprotocol/telegraph-usecases`
5. official Telegraph repositories linked from those sources
6. external references only when necessary and explicitly labeled

Never invent Telegraph addresses, ABI values, Intent schemas, Miner protocol details, or contract constants. Re-verify current official sources before implementation when facts may have changed.

## Current hackathon strategy

The official Hackathon 1 site currently describes a three-round ecosystem: Miners/Scripts first, applications next, then evaluation/results. The current rules emphasize Miner ranking/performance and real application demand. The project therefore targets a narrow, high-confidence deterministic intelligence wedge first and avoids feature-count-driven development.

The complete strategy is in `docs/WINNING-STRATEGY.md`.

## Phase roadmap

### Phase 0 — Constitution & continuity
**Status: COMPLETE**

### Phase 1 — EVM Analysis Core
**Status: CURRENT**

- runtime/configuration foundation
- resilient JSON-RPC transport
- external verification boundary
- evidence/provenance model
- strict validation
- ownership
- proxy
- pause/mint capabilities
- adversarial/regression tests

### Phase 2 — Proxy-Aware Composition
**Status: PLANNED**

### Phase 3 — Contract Intelligence Engine
**Status: PLANNED**

### Phase 4 — Telegraph Compatibility
**Status: PLANNED**

### Phase 5 — Evaluation & Performance
**Status: PLANNED**

### Phase 6 — Product Application
**Status: PLANNED**

### Phase 7 — Brand & Judge Demo
**Status: PLANNED**

### Phase 8 — Hackathon Operations
**Status: PLANNED**

### Phase 9 — H2/H3 Evolution
**Status: PLANNED**

See `docs/ROADMAP.md` for the complete task-level plan.

## Architecture authority

- `docs/ARCHITECTURE.md` — current system architecture
- `docs/DECISIONS.md` — durable architectural decisions
- `docs/WINNING-STRATEGY.md` — competitive/product strategy
- `docs/TELEGRAPH_REFERENCE.md` — official protocol reference map
- `docs/UI-UX-BLUEPRINT.md` — product and motion design
- `docs/phases/` — phase-specific implementation contracts

## Global quality gates

Every meaningful milestone must include, as applicable:

- strict typecheck
- complete test suite
- regression coverage
- no fabricated protocol/blockchain constants
- explicit external dependency failure semantics
- security review of new trust boundaries
- measured latency for network paths
- documentation/state update
- coherent commits; avoid unnecessary CI-triggering micro-commits

## Continuation rule

When a new chat or agent opens the repository:

1. Read `PROJECT_STATE.md`.
2. Read `AGENTS.md` and `CLAUDE.md` for repository operating rules.
3. Read the current phase document.
4. Inspect the actual source tree before assuming any module exists.
5. Read `docs/DECISIONS.md` before changing an accepted architectural decision.
6. Re-check official Telegraph sources for current protocol facts.
7. Continue from the first incomplete task; do not restart completed work.
8. Update this state after meaningful milestones.

## Current next action

**Implement Phase 01 — EVM Analysis Core.** Inspect the current minimal source tree, establish the strict TypeScript/test/runtime foundation, then implement the smallest correct deterministic EVM primitives and their adversarial tests. Do not jump to UI polish or speculative Telegraph integration.
