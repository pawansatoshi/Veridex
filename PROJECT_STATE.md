# Veridex — Persistent Project State

> **Single source of truth for continuation across chats, agents, IDEs, and sessions.**
>
> Last reviewed: 2026-08-13

## Mission

Build **Veridex — Verifiable On-Chain Intelligence** into a production-grade, deterministic-first Telegraph Miner that can compete on canonical performance, serve real applications, and remain extensible for future Telegraph hackathons and mainnet.

Veridex is a real product, not a disposable hackathon demo. Engineering decisions optimize for correctness, evaluation alignment, performance, real utility, UX, differentiation, and long-term extensibility in that order.

## Operating ownership

The project is built and directed directly in this repository. Do not assume Claude Code or another external agent is the project owner. Any future agent must read this file and the repository instructions before acting.

## Current status

**Stage: Phase 01 — EVM Analysis Core (implementation in progress)**

Repository: `pawansatoshi/Veridex`
Default branch: `main`
Working implementation branch: `phase-01-core`
Visibility: public

Phase 00 is complete. Phase 01 remains open. Phase 02 has not started.

## Verified implementation completed in Phase 01 so far

- strict EVM address/hex validation and bounded bytecode size
- instruction-aligned EVM bytecode walker with correct PUSH operand handling
- selector fallback restricted to actual PUSH4 instruction boundaries
- shared timeout/retry/circuit-breaker foundation for external calls
- JSON-RPC client with explicit application-revert vs provider-failure semantics
- JSON-RPC quantity block-tag validation
- Etherscan-compatible verification boundary with verified/unverified/unavailable separation
- preservation of `not_configured`, unverified, rate-limit, malformed-response and provider-failure distinctions
- bounded ABI parsing
- evidence provenance, fallback reason, certainty status and additive result fields
- ERC-1967 implementation/beacon observation with explicit unresolved beacon semantics
- ownership observation and renounced-owner detection
- verified-ABI negative ownership result does not fall back to selector heuristics
- pause capability and live paused-state checks
- mint capability detection with authority explicitly left unknown without stronger evidence
- bounded concurrency utility
- validated runtime configuration boundary
- deterministic in-memory analysis event/telemetry abstraction
- normalized Phase 01 analysis orchestration preserving `contractAddress` vs `codeAddress`
- fail-closed unresolved-beacon orchestration; no beacon address is treated as an implementation
- adversarial unit tests and optional live-RPC integration-test structure
- synchronized npm lockfile
- read-only CI with `npm ci`, strict typecheck, full tests and high-severity dependency audit

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

1. Selector clashing makes bytecode selector detection weaker than verified ABI/source evidence.
2. Bytecode scanners must walk actual EVM instruction boundaries; arbitrary byte scanning can false-positive inside PUSH operands.
3. Malformed bytecode must become structured error evidence rather than crash a check.
4. Etherscan/API failure, unverified contract, and missing configuration are distinct states.
5. RPC JSON-RPC reverts are application-level outcomes, not infrastructure outages.
6. Delegatecall proxies require implementation code/ABI inspection while live state remains in proxy storage context.
7. Beacon detection is not implementation resolution; the beacon's implementation interface must be called before capability inspection.

## Official Telegraph reference hierarchy

1. `https://docs.telegraphprotocol.com/docs`
2. `https://hackathon.telegraphprotocol.com/rules`
3. `https://hackathon.telegraphprotocol.com/supported-intents`
4. `https://github.com/telegraphprotocol/telegraph-usecases`
5. official Telegraph repositories linked from those sources
6. external references only when necessary and explicitly labeled

Never invent Telegraph addresses, ABI values, Intent schemas, Miner protocol details, or contract constants. Re-verify current official sources before implementation when facts may have changed.

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

- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/WINNING-STRATEGY.md`
- `docs/TELEGRAPH_REFERENCE.md`
- `docs/UI-UX-BLUEPRINT.md`
- `docs/phases/`

## Remaining Phase 01 work

- verified-source evidence depth beyond the current ABI boundary where a correctness gap justifies it
- explicit mint-authority evidence model beyond capability presence
- fuller transparent/UUPS classification
- beacon `implementation()` resolution integration coverage (Phase 02 owns the composition layer)
- real-chain integration corpus when a verified test network/fixture is available
- stronger provider-health metrics/telemetry and measured network latency
- final Phase 01 exit review against every documented gate

## Must not be implemented yet

- Phase 2 proxy-aware composition as a separate orchestration layer
- Telegraph Miner adapter/payment/auth lifecycle
- web/mobile UI
- persistent Watch runtime
- email/webhook notification delivery
- proprietary risk scoring
- LLM explanation layer

## Continuation rule

1. Read `PROJECT_STATE.md`.
2. Read `AGENTS.md` and `CLAUDE.md`.
3. Read the current phase document.
4. Inspect the actual source tree before assuming any module exists.
5. Read `docs/DECISIONS.md` before changing an accepted architectural decision.
6. Re-check official Telegraph sources for current protocol facts.
7. Continue from the first incomplete task; do not restart completed work.
8. Update this state after meaningful milestones.

## Current next action

**Close the remaining Phase 01 evidence/security gaps and perform the formal Phase 01 exit review.** Do not begin Phase 02 until every exit criterion is verified rather than inferred.
