# Veridex — Persistent Project State

> **Single source of truth for continuation across chats, agents, IDEs, and sessions.**
>
> Last reviewed: 2026-08-13

## Mission

Build **Veridex — Verifiable On-Chain Intelligence** into a production-grade, deterministic-first smart-contract intelligence layer that can compete in Telegraph Hackathon 1, serve real applications/agents, and evolve into a persistent product for future Telegraph rounds and mainnet.

Core promise:

> **Know what a contract can do — and know when its powers change.**

Core trust principle:

> **No evidence → no certainty.**

## Operating ownership

The project is built and directed directly in this repository. Do not assume Claude Code or another external agent is the project owner. Any future agent must read this file and repository instructions before acting.

## Source-of-truth policy

Priority:

1. live repository implementation
2. `PROJECT_STATE.md`
3. `AGENTS.md` / `CLAUDE.md`
4. roadmap documents
5. architecture / decision documents
6. phase documents
7. tests
8. previous-chat claims

Documentation describes intent. Code/tests prove implementation.

## Current phase

**CURRENT PHASE: H1 Miner Critical Path / Phase 01 — EVM Analysis Core**

Repository: `pawansatoshi/Veridex`
Default branch: `main`
Visibility: public

Phase 00 is complete. Phase 01 remains the implementation foundation. H1 rebaseline does not lower Phase 01 correctness/security requirements; it prioritizes the smallest reliable deterministic Miner path.

## Official H1 dates

- **Aug 13–16, 2026:** foundation sprint
- **Aug 17–31, 2026:** Track 1 Miner + Track 2 Script Author window
- **Aug 31–Sep 7, 2026:** Track 3 Applications/Agents window
- **Sep 7, 2026:** H1 final boundary

Official rules currently state Miner judging is 75% Normalized Performance within the chosen Intent and 25% X Engagement & Updates. Track 3 must use real Miners, and Miners must remain live through Track 3. Re-check official sources before protocol-specific implementation because facts may change.

## Immediate objective

**Competitive Telegraph Miner.**

The H1 Miner must answer:

> **What important capabilities does this smart contract expose, and what evidence supports that conclusion?**

H1 capability wedge:

1. ownership / control
2. upgradeability / proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

Do not expand capability count until these are reliable and benchmarked.

## H1 critical pipeline

```text
User/Application
      ↓
Telegraph Intent
      ↓
Contract Address
      ↓
Strict Validation
      ↓
Chain / RPC
      ↓
Verification Evidence
      ↓
Proxy / Code Address Resolution
      ↓
Capability Analysis
      ↓
Evidence Normalization
      ↓
Conclusive / Inconclusive State
      ↓
Machine-Readable Miner Response
      ↓
Performance Measurement
      ↓
Telegraph Miner
```

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
- Scoring is deferred until actual Telegraph evaluation requirements justify it.
- Beacon proxy resolution is explicit; a beacon address is not an implementation address.
- Evaluation code remains independent from production analysis logic.
- UI consumes backend truth and visualizes real analysis events.
- Future Passport/Watch/Policy/Alert/Mobile/Agent ideas remain preserved but must not block H1 Miner delivery.

## Historical Sentinel lessons to preserve

Prior art, not proof of current implementation:

1. Selector clashing makes bytecode selector detection weaker than verified ABI/source evidence.
2. Bytecode scanners must walk actual EVM instruction boundaries; arbitrary byte scanning can false-positive inside PUSH operands.
3. Malformed bytecode must become structured error evidence rather than crash a check.
4. Etherscan/API failure, unverified contract, and missing configuration are distinct states.
5. RPC JSON-RPC reverts are application-level outcomes, not infrastructure outages.
6. Delegatecall proxies require implementation code/ABI inspection while live state remains in proxy storage context.
7. Beacon detection is not implementation resolution; the beacon's implementation interface must be called before capability inspection.

## Telegraph reference hierarchy

Use sources in this order:

1. `https://docs.telegraphprotocol.com/docs`
2. `https://hackathon.telegraphprotocol.com/rules`
3. `https://hackathon.telegraphprotocol.com/supported-intents`
4. `https://github.com/telegraphprotocol/telegraph-usecases`
5. official Telegraph repositories linked from those sources
6. external references only when necessary and explicitly labeled

Never invent Telegraph addresses, ABI values, Intent schemas, Miner protocol details, or contract constants.

## Long-term product vision — preserved

Veridex must eventually evolve:

```text
Analyze → Verify → Discover Powers → Capability Passport → Watch
→ Capability Change Intelligence → Policy → Alert → Agent/API → Telegraph
```

The long-term product is **continuous smart-contract capability intelligence**, not a generic one-shot scanner.

Preserved strategic capabilities:

- Capability Passport
- continuous Watch
- shared observation / deduplication / bounded polling
- Change Intelligence
- Capability Time Machine
- Capability Policy Engine
- evidence-backed posture/ranking after ground-truth calibration
- email/webhook/mobile notification router
- responsive/PWA web
- native mobile
- Apple-grade UX
- 3D Contract Core
- five product pillars
- agent/API/SDK/MCP interfaces
- broader Telegraph integrations
- enterprise policy tooling

## Five product pillars

1. **UNDERSTAND** — What is this contract?
2. **VERIFY** — Why should I believe the result?
3. **DISCOVER POWERS** — What can this contract do?
4. **WATCH** — What changes after I leave?
5. **CONNECT** — Can humans, applications, agents and Telegraph consume this intelligence?

H1 focuses on UNDERSTAND, VERIFY, DISCOVER POWERS and CONNECT through the Miner. WATCH is post-H1.

## Current implementation state

### Implemented on `main`

- strict TypeScript compiler settings
- EVM address validation primitive
- shared `CheckResult` / analysis type foundation
- additive detection/fallback provenance fields at the type level
- Vitest unit-test foundation
- bounded runtime configuration with validated RPC URL and numeric limits
- shared circuit-breaker and RPC failure classification primitives
- resilient JSON-RPC client with timeout, bounded retry, malformed-response handling and circuit protection
- explicit separation of application-level JSON-RPC errors/reverts from infrastructure failures
- adversarial regression tests for reverts, provider failures and circuit behavior
- repository continuity and architecture documents
- official Telegraph reference hierarchy

### Partially implemented on `main`

- Phase 01 runtime foundation: transport/resilience is implemented; deterministic telemetry and bounded concurrency remain
- RPC infrastructure: core client exists; real-provider integration and measurement remain

### Not yet implemented on `main`

- verification client
- bytecode validation/walker
- evidence normalization runtime
- ownership runtime check
- pause runtime check
- mint runtime check
- proxy resolver
- analysis orchestrator
- normalized Miner response runtime
- ground-truth corpus
- Telegraph adapter
- live Miner endpoint
- performance harness
- Passport
- Watch
- Change Intelligence runtime
- Policy Engine runtime
- alert router/email/webhook/mobile
- web UI/PWA
- native mobile

A separate `phase-01-core` branch exists, but **main is the source of truth for current implementation**. Do not claim code from that branch is merged or present on main without verifying it.

## Current H1 task status

### H1_CRITICAL

- runtime foundation — **IN PROGRESS; transport/resilience baseline implemented**
- resilient RPC and verification infrastructure — **RPC baseline implemented; verification pending**
- evidence hierarchy
- instruction-aligned bytecode analysis
- ownership/pause/mint checks
- minimum proxy-aware semantics
- adversarial regression tests — **RPC/circuit baseline covered; EVM regressions pending**
- official Telegraph Intent selection/adapter after source verification

### H1_OPERATIONAL

- live Miner deployment
- performance measurement
- operational reliability
- ground-truth evaluation
- legitimate Track 3 usage
- X transparency/progress

### POST_H1

- Phase 2 proxy-aware composition beyond H1 minimum
- Capability Intelligence expansion
- Capability Passport
- Watch
- Change Intelligence
- Time Machine
- Policy Engine
- alert channels
- production web/PWA
- premium UX/3D
- native mobile
- agent/enterprise evolution

### BLOCKED UNTIL VERIFIED

- choosing a Telegraph Intent until the official supported-intents contract is inspected
- adding official Telegraph addresses/constants until verified from current official sources
- numerical Veridex scoring until evaluation requirements and ground truth justify it
- beacon implementation claims without actual resolution

## Security requirements

H1 security is mandatory:

- strict input validation
- malformed bytecode/ABI safety
- bounded parser work
- instruction-boundary scanning
- RPC timeout
- bounded retries
- circuit breaker
- application-level revert classification
- provider failure cannot become contract evidence
- client input cannot become canonical evidence
- bounded resource consumption
- no secrets in client code
- dependency/CI security basics
- adversarial regression tests

Future API/web/mobile security remains a later production architecture milestone, but its trust boundaries must remain compatible with the H1 core.

## Known roadmap clarification

The original roadmap did not give Policy Engine a dedicated phase. The H1 rebaseline now establishes:

**Phase 3.7 — Capability Policy Engine — POST-H1 / PLANNED**

Required policy outputs are `COMPLIANT`, `VIOLATION`, and `INCONCLUSIVE` with evidence-backed reasoning and no premature scoring mathematics.

## Global quality gates

Every meaningful milestone must include, as applicable:

- strict typecheck
- complete test suite
- regression/adversarial coverage
- no fabricated protocol/blockchain constants
- explicit external dependency failure semantics
- security review of new trust boundaries
- measured latency for network paths
- documentation/state update
- coherent commits; avoid unnecessary CI-triggering micro-commits

## Continuation rule

When a new chat or agent opens the repository:

1. Read `PROJECT_STATE.md`.
2. Read `AGENTS.md` and `CLAUDE.md`.
3. Read `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and the current H1 phase document.
4. Inspect the actual source tree before assuming any module exists.
5. Re-check official Telegraph sources for current protocol facts.
6. Continue from the first incomplete H1 task.
7. Never start post-H1 work merely because it is documented.
8. After a meaningful milestone, update this state with actual implementation/test evidence.

## Next engineering task

**Build the EVM evidence foundation:** strict bytecode validation and an instruction-boundary walker, with PUSH-data selector-decoy and malformed-bytecode regression tests. Then build verification/evidence normalization before capability checks.

## Last verified commit

`70c0beab8cba39479c13758a131781f75fbff9ae` — H1 runtime/RPC foundation with regression tests. GitHub-side CI execution was not available for this milestone; local execution was unavailable because the environment could not resolve github.com, so test status must be re-verified on the next CI-capable run.
