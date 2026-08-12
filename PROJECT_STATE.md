# Veridex — Persistent Project State

> **Single source of truth for continuation across chats, agents, IDEs, and sessions.**
>
> Last reviewed: 2026-08-13

## Mission

Build **Veridex — Verifiable On-Chain Intelligence** into a production-grade, deterministic Telegraph Miner that can compete on canonical performance while remaining auditable, resilient, fast, and genuinely useful to downstream agents and applications.

This is a hackathon product and a post-hackathon infrastructure project. We optimize for correctness and measurable performance first, then product quality, UX, differentiation, and legitimate adoption.

## Current Status

**Stage: Phase 01 — EVM Analysis Core**

Repository: `pawansatoshi/Veridex`
Default branch: `main`
Visibility: public

Phase 00 (Constitution & Continuity) is complete. Phase 01 is the current implementation milestone.

The repository was created as a clean Veridex codebase. Earlier Sentinel work from a separate environment is treated as architectural prior art, not as code that already exists in this repository. Do not claim old test counts or modules exist here unless verified in GitHub.

## Completed / Accepted Decisions

- Product name: **Veridex**
- Positioning: **Verifiable On-Chain Intelligence**
- Deterministic evidence is the core product principle.
- Proxy-aware analysis is mandatory.
- Verified ABI/source evidence is preferred over selector heuristics.
- Bytecode scanning is fallback evidence, never the sole source of truth when stronger evidence exists.
- Infrastructure failures must not become false contract signals.
- Every fallback and degradation path must be observable.
- Domain checks remain independently testable.
- Telegraph integration remains separated from core analysis logic.
- Shared `CheckResult` evidence is additive and provenance-aware.
- Scoring must not be invented prematurely; first understand Telegraph's actual evaluation contract.
- Beacon proxy resolution is a known architectural gap to solve deliberately, not silently assume.

## Historical Sentinel Lessons To Preserve

These are design lessons from the earlier Sentinel implementation/review. They are **not proof that the corresponding files exist in this repository**.

1. Selector clashing makes bytecode selector detection weaker than verified ABI/source evidence.
2. Bytecode scanners must walk actual EVM instruction boundaries; scanning arbitrary byte offsets creates false positives inside PUSH operands.
3. Malformed bytecode must return a structured error rather than crash a check.
4. Etherscan API failure, unverified contract, and missing configuration are different states and must remain distinguishable.
5. RPC JSON-RPC reverts are application-level outcomes, not infrastructure outages; they must not trip the shared circuit breaker.
6. For delegatecall proxies, capability detection may need implementation bytecode/ABI while live state reads must preserve the original proxy address/storage context.
7. Beacon proxy detection is not equivalent to implementation resolution: the beacon slot identifies a beacon contract, whose `implementation()` must be resolved before capability inspection can target the implementation.

## Official Telegraph Reference Hierarchy

Use sources in this order:

1. Official Telegraph docs: `https://docs.telegraphprotocol.com/docs`
2. Official Telegraph hackathon rules: `https://hackathon.telegraphprotocol.com/rules`
3. Official supported intents: `https://hackathon.telegraphprotocol.com/supported-intents`
4. Official use cases: `https://github.com/telegraphprotocol/telegraph-usecases`
5. Official Telegraph repositories linked from the docs
6. External references only when necessary, explicitly labeled as external.

Never invent Telegraph addresses, ABI values, intent schemas, Miner protocol details, or contract constants. Verify them against the current official source before implementation.

## Current Hackathon Strategy

Telegraph's current rules emphasize that the Miner track is judged primarily by **Normalized Performance within an Intent (75%)**, with **X engagement/transparency (25%)**. An eligible global-prize Intent requires at least 3 active Miners and 100 real Track 3 requests. Miners must remain live through Track 3, and simulated/mocked application demand is not allowed.

Therefore:

- Optimize for deterministic canonical performance and reliability.
- Choose the Intent based on the actual supported/evaluation contract, not merely the closest-sounding name.
- Do not distort Veridex's domain semantics just to fit an Intent label.
- Treat latency, failure behavior, evidence quality, and repeatability as first-class engineering metrics.
- Build real application utility and legitimate demand paths.
- X updates must be meaningful and transparent, never metric gaming.

## Phase Roadmap

### Phase 0 — Project Constitution
**Status: COMPLETE**

- Persistent state and agent instructions
- Architecture blueprint
- Decision log
- Telegraph reference map
- UI/UX/brand blueprint
- Definition of done and quality gates

### Phase 1 — Analysis Core
**Status: CURRENT**

- EVM primitives and strict address/hex validation
- resilient RPC transport
- verified ABI/source client boundary
- evidence/provenance model
- ownership analysis
- proxy analysis
- implementation resolution
- pause capability
- mint capability
- adversarial/regression tests

### Phase 2 — Proxy-Aware Composition
**Status: PLANNED**

- transparent/UUPS implementation composition
- beacon proxy resolution via beacon contract where verified/supported
- explicit direct-vs-proxy evidence provenance
- capability checks against correct code address
- live state checks against correct storage context
- deterministic error/degradation semantics

### Phase 3 — Contract Intelligence Engine
**Status: PLANNED**

- normalized contract analysis graph
- evidence aggregation without premature probabilistic scoring
- confidence semantics
- explainable findings
- machine-readable response contract
- evaluation fixtures and ground-truth corpus

### Phase 4 — Telegraph Miner Adapter
**Status: PLANNED**

- verify current official Miner protocol/configuration
- exact supported Intent contract
- request validation
- response normalization
- x402/payment integration if required by the current Miner path
- health/readiness
- timeouts/retries/circuit behavior
- observability
- live deployment

### Phase 5 — Canonical Performance & Evaluation
**Status: PLANNED**

- benchmark corpus
- deterministic evaluator alignment
- latency budgets
- cache policy where safe
- RPC/Etherscan call minimization
- concurrency limits
- reliability testing
- adversarial cases
- performance regression gates

### Phase 6 — Product / Application Layer
**Status: PLANNED**

- Veridex web application
- contract address search
- animated analysis journey
- evidence explorer
- proxy/implementation graph
- confidence/evidence presentation
- responsive/mobile UX
- accessibility
- shareable analysis reports
- API/developer experience

### Phase 7 — Brand & Demo
**Status: PLANNED**

- Veridex visual identity
- motion language
- polished landing page
- judge-first demo flow
- technical architecture visualization
- live Miner proof
- evidence provenance visualization
- performance dashboard
- documentation

### Phase 8 — Hackathon Operations
**Status: PLANNED**

- Miner registration and live operation
- real application integration
- legitimate request generation
- monitoring during Track 3
- X update cadence
- final demo narrative
- submission checklist
- reproducibility package

### Phase 9 — Post-Hackathon Hardening
**Status: PLANNED**

- broader proxy standards
- source/AST analysis if justified
- additional contract-risk modules
- caching and provider strategy
- multi-chain support where valuable
- streaming/persistent intelligence if supported/useful
- SDK/MCP/application integrations

## Global Quality Gates

Every phase must satisfy, where applicable:

- strict typecheck
- full unit suite
- regression coverage
- no fabricated blockchain constants
- explicit external-dependency failure semantics
- security review of new trust boundaries
- latency measurement for network paths
- documentation update
- project state update

## Continuation Rule

When a new chat/agent opens the repository:

1. Read `PROJECT_STATE.md` first.
2. Read `AGENTS.md` / `CLAUDE.md` next.
3. Read the current phase document in `docs/phases/`.
4. Inspect the actual repository before assuming any module exists.
5. Read `docs/DECISIONS.md` before changing an accepted architectural decision.
6. Use official Telegraph sources for current protocol facts.
7. Continue from the first incomplete phase/task; do not restart completed work.
8. Update project state after meaningful milestones.

## Current Next Action

**Begin Phase 01 — EVM Analysis Core.** First inspect the actual current source tree, establish the strict TypeScript/test foundation, then implement the smallest correct deterministic analysis primitives. Do not jump to UI polish or speculative Telegraph integration.
