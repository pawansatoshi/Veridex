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

**Stage: Phase 01 — EVM Analysis Core (implementation in progress)**

Repository: `pawansatoshi/Veridex`
Default branch: `main`
Working implementation branch: `phase-01-core`
Visibility: public

Phase 00 is complete. Phase 01 is the current implementation milestone. Phase 02 has not started.

## Verified implementation completed in Phase 01 so far

- strict EVM address validation retained
- strict even-length hex validation and bytecode size bound
- instruction-aligned EVM bytecode walker with PUSH operand handling
- selector fallback that only inspects PUSH4 instruction boundaries
- shared evidence provenance and explicit failure/certainty semantics
- bounded timeout/retry/circuit-breaker foundation for external calls
- JSON-RPC client with separate application-revert classification
- `eth_getCode`, `eth_getStorageAt`, and `eth_call` validation boundaries
- Etherscan-compatible verification boundary with verified/unverified/unavailable separation
- ABI structural validation with bounded entry/input counts
- ERC-1967 implementation/beacon slot observation
- explicit unresolved beacon semantics; beacon address is never treated as implementation
- ownership observation and renounced-owner detection
- pause capability and live paused-state checks
- mint capability detection with authority explicitly left unknown unless stronger evidence exists
- adversarial unit coverage for malformed bytecode, PUSH-data decoys, reverts, timeouts, circuit breaking, verification states, provenance, ownership, pause, mint and ERC-1967 proxy evidence
- optional live-RPC integration-test structure
- CI strict typecheck/test/audit baseline with read-only workflow permissions and pinned action revisions

These are implementation facts verified from the live branch; they are not Phase 01 completion claims.

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
**Status: CURRENT / IN PROGRESS**

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

## Remaining Phase 01 work

- bounded concurrency abstraction for orchestrated checks
- deterministic telemetry/event abstraction
- stronger provider-health classification and metrics
- verified source boundary where justified by current architecture
- explicit mint-authority evidence model beyond capability presence
- fuller proxy-pattern classification and implementation-resolution integration coverage
- malformed external-response regression depth
- real-chain integration corpus when a verified test network/fixture is available
- cross-module normalized analysis orchestration/result contract
- complete Phase 01 exit-gate verification and measured network latency

## Must not be implemented yet

- Phase 2 proxy-aware composition as a separate orchestration layer
- Telegraph Miner adapter
- Telegraph payment/auth lifecycle
- web/mobile UI
- persistent Watch runtime
- email/webhook notification delivery
- proprietary risk scoring
- LLM explanation layer

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

**Finish the remaining Phase 01 correctness/security gates without starting Phase 02.** The immediate engineering target is the normalized Phase 01 orchestration boundary plus remaining adversarial/provider-failure coverage, followed by strict CI verification and a Phase 01 exit review. Phase 02 must remain blocked until the documented exit criteria are genuinely satisfied.
