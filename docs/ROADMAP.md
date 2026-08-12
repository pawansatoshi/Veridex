# Veridex Master Roadmap

## North Star

Build **Veridex — Verifiable On-Chain Intelligence** into a production-grade, deterministic-first Telegraph Miner that can compete on canonical performance, serve real applications, and remain extensible for future Telegraph hackathons and mainnet.

## Winning thesis

Telegraph's current hackathon model rewards Miner performance and real demand. Veridex therefore optimizes for **correctness → evaluation alignment → latency/reliability → real utility/demand → UX → differentiation → transparent growth**.

Veridex is not a generic scanner or LLM wrapper. Its initial wedge is evidence-backed contract intelligence: ownership/admin authority, proxy/implementation semantics, pause and mint capabilities, verified ABI/source provenance, deterministic fallback evidence, and explicit degradation.

### Strategic differentiator — Capability Passport + Change Intelligence

Veridex will evolve beyond one-shot analysis into a provenance-backed **Capability Passport**: a versioned snapshot of what a contract is demonstrably capable of doing and how that conclusion was established.

The next layer is **Change Intelligence**: safely distinguishing a real control/capability change from an evidence-quality change or infrastructure failure.

The product will support **persistent Capability Watch**: after a user adds a contract once, Veridex can continue observing it, surface meaningful changes automatically, maintain its passport/history, and alert the user without requiring another Analyze click. Monitoring is an explicitly resource-bounded service, not an unlimited free polling promise.

The full competitive strategy is maintained in `docs/WINNING-STRATEGY.md`.

## Phase map

| Phase | Name | Status | Exit condition |
|---|---|---|---|
| 0 | Constitution & continuity | 🟢 complete | persistent project memory and operating rules are established |
| 1 | EVM analysis core | 🔵 current | deterministic transport, evidence and checks are implemented and tested |
| 2 | Proxy-aware composition | ⏳ planned | direct, transparent/UUPS and supported beacon flows have correct code/state semantics |
| 3 | Contract intelligence engine | ⏳ planned | normalized machine-readable analysis result with provenance |
| 3.5 | Capability Passport & Persistent Watch | ⏳ planned | safe versioned snapshots, monitoring, change detection and alert semantics |
| 4 | Telegraph compatibility | ⏳ planned | current official Intent/Miner contract is verified and adapter is live |
| 5 | Evaluation & performance | ⏳ planned | benchmark corpus, canonical evaluation alignment and latency/reliability budgets |
| 6 | Product application | ⏳ planned | polished web/API experience consuming the same analysis result |
| 7 | Brand & judge demo | ⏳ planned | compelling live proof of intelligence, provenance, performance and utility |
| 8 | Hackathon operations | ⏳ planned | live Miner, legitimate application demand, monitoring and submission |
| 9 | H2/H3 evolution | ⏳ planned | evidence-driven expansion for future Telegraph rounds and mainnet |

## Phase 0 — Constitution & continuity — COMPLETE

- [x] repository and product identity
- [x] persistent project state
- [x] agent operating contract
- [x] roadmap and architecture
- [x] decision log
- [x] official Telegraph reference hierarchy
- [x] UI/UX and motion blueprint
- [x] winning strategy
- [x] capability-passport/change-intelligence strategy

## Phase 1 — EVM Analysis Core — CURRENT

### Runtime and transport

- [ ] strict runtime/configuration foundation
- [ ] resilient JSON-RPC client
- [ ] timeout and bounded retry policy
- [ ] circuit breaker with application-level revert classification
- [ ] provider configuration validation
- [ ] bounded concurrency
- [ ] deterministic telemetry abstraction

### Evidence and validation

- [ ] strict address/hex validation
- [ ] bytecode validation and instruction walker
- [ ] typed ABI representation
- [ ] evidence provenance model
- [ ] detection method/fallback semantics
- [ ] structured error provenance

### Checks

- [ ] ownership observation and renounced ownership
- [ ] expected non-Ownable behavior
- [ ] proxy detection and implementation resolution
- [ ] beacon detection with explicit unresolved state
- [ ] pause capability and live paused state
- [ ] mint capability and authority
- [ ] ABI-first exact signature detection
- [ ] instruction-aligned bytecode fallback

### Adversarial regression coverage

- [ ] selector collision limitation
- [ ] PUSH-data selector decoy
- [ ] malformed bytecode
- [ ] RPC application revert
- [ ] timeout
- [ ] circuit breaker
- [ ] provider/API failure classification

## Phase 2 — Proxy-aware composition

Resolve the correct analysis context before running capability checks.

Required semantics:

1. direct contract → direct code and storage
2. transparent/UUPS proxy → implementation code + proxy storage/state
3. supported beacon proxy → beacon contract → verified implementation + proxy storage/state
4. unresolved implementation → explicit degraded result, never misleading direct analysis

Exit only after real-chain assumptions have integration coverage or an explicit documented reason why verification is unavailable.

## Phase 3 — Contract Intelligence Engine

Create one normalized analysis object consumed by both agents and UI.

Layers:

```text
request
identity
proxy
checks
 evidence
quality
errors
metadata
```

Do not introduce proprietary risk scoring until the chosen Telegraph Intent/evaluation contract requires it.

Build a versioned ground-truth corpus alongside the engine.

## Phase 3.5 — Capability Passport & Persistent Watch

Build only after the normalized analysis result is stable.

### Passport

- [ ] versioned analysis snapshot
- [ ] explicit freshness metadata
- [ ] serializable evidence provenance
- [ ] deterministic snapshot identity/hash where justified
- [ ] clear distinction between observation and interpretation

### Continuous observation

- [ ] watch registration for a contract/network pair
- [ ] initial observation and baseline passport
- [ ] adaptive polling schedule
- [ ] event/log driven observation where reliable
- [ ] provider-aware batching and caching
- [ ] bounded concurrency and per-watch resource budgets
- [ ] pause/resume watch
- [ ] observation retention policy

### Change intelligence

- [ ] compare compatible snapshots
- [ ] implementation/control-plane change detection
- [ ] capability change detection
- [ ] evidence-quality change detection
- [ ] `conclusive` vs `inconclusive` comparison status
- [ ] never infer removal from degraded/missing evidence
- [ ] severity classification with explainable evidence
- [ ] alert deduplication

### Live user experience

A user should be able to:

`add contract → watch active → leave → return later → see current state + change timeline`

No repeated Analyze action is required while a watch is active.

Potential alert channels:

- in-app notifications
- browser push
- email
- Telegram/webhook integrations where appropriate
- agent/MCP event consumption

Every alert must contain:

```text
what changed
previous state
current state
evidence
confidence
observed at
comparison status
```

### Ranking and scoring

Veridex may maintain an internal, versioned intelligence/risk profile for watched contracts, but raw evidence remains separate from interpretation. A score must never be presented as an official Telegraph ranking unless the official Telegraph evaluation system explicitly defines it.

When a score exists it must be reproducible, timestamped, evidence-linked and explainable.

### Capability Time Machine

Every meaningful passport version can become a timeline point:

```text
v1 ── v2 ── v3 ── v4 ── CURRENT
      ↑             ↑
   pause added   implementation changed
```

The UI can replay the evidence transition that produced a change event.

Full monitoring design: `docs/CAPABILITY-MONITOR.md`.

## Phase 4 — Telegraph compatibility

Before coding the adapter, re-verify the current official Telegraph documentation, supported intents and hackathon specifications.

Verify:

- exact Intent request/response schema
- Miner registration/lifecycle
- current configuration
- evaluation behavior
- x402/payment path if required
- official addresses/constants
- whether Capability Change Intelligence maps to an existing Intent or should remain an application-level signal

Then implement a thin adapter that owns Telegraph protocol concerns while the analysis engine remains protocol-independent.

## Phase 5 — Evaluation & performance

Treat performance as a product feature.

Measure:

- canonical correctness
- deterministic repeatability
- p50/p95/p99 latency
- timeout/error rate
- provider failure behavior
- false-positive/false-negative rates
- concurrency behavior
- safe cache effectiveness
- comparison correctness for change intelligence
- monitoring freshness and resource cost

Optimize only against measurements.

## Phase 6 — Product application

Build the web experience from the normalized backend result.

Primary journey:

`address → chain → live analysis → proxy/implementation graph → evidence → capability passport → watch active → live change alerts → change history → machine-readable output`

No fake progress. Analysis animation represents actual events.

Core views:

1. landing
2. analyze
3. live analysis timeline
4. intelligence dashboard
5. evidence explorer
6. proxy graph
7. individual check detail
8. provenance/confidence
9. capability passport
10. watch center / active watches
11. change timeline / Capability Time Machine
12. alert detail
13. raw result/API
14. Miner information

## Phase 7 — Brand & judge demo

Brand: **VERIDEX**

Descriptor: **Verifiable On-Chain Intelligence**

Core differentiator:

> **Don't just analyze a contract. Know when its powers change.**

Demo must prove, in a short live flow:

1. real contract input
2. proxy discovery
3. implementation resolution
4. evidence hierarchy
5. capability findings
6. provenance/degradation
7. deterministic result
8. persistent watch activation
9. evidence-backed capability change alert
10. Capability Passport / timeline
11. Telegraph Miner path
12. latency/performance evidence
13. downstream agent utility

## Phase 8 — Hackathon operations

For the active Telegraph round:

- [ ] confirm current Track 1 dates from official rules
- [ ] register Miner
- [ ] confirm Intent
- [ ] confirm evaluation behavior
- [ ] deploy live endpoint
- [ ] monitor latency and errors
- [ ] obtain legitimate application usage
- [ ] remain live through the required application window
- [ ] publish meaningful progress updates
- [ ] avoid artificial metric inflation
- [ ] submit reproducible demo/package

## Phase 9 — H2/H3 evolution

Use real H1 evidence to prioritize:

- additional high-value risk capabilities
- broader proxy standards
- source/AST analysis if justified
- multi-chain support where demand exists
- persistent signals
- capability change feeds
- MCP/agent integrations
- SDKs
- historical contract intelligence
- provider/caching strategy
- enterprise observability

## Quality gates for every phase

- strict typecheck
- complete test suite
- regression coverage
- no fabricated blockchain/Telegraph constants
- explicit external dependency failure semantics
- security review of new trust boundaries
- measured network latency where applicable
- documentation/state update
- coherent commits; avoid unnecessary CI-triggering micro-commits

## Never-do list

- never fabricate official addresses, ABI values, selectors or Intent schemas
- never treat RPC reverts as provider outages
- never treat selector scanning as stronger than verified ABI/source
- never claim beacon implementation resolution without resolving it
- never hide fallback reasons
- never infer a capability change from degraded evidence
- never invent scoring before evaluation requirements are known
- never sacrifice correctness for animation
- never fake usage, engagement or demand
- never couple core analysis logic to Telegraph transport
- never optimize only for one hackathon and make H2/H3 evolution impossible
- never treat a failed monitoring observation as evidence of a contract change
- never promise unlimited/free monitoring without an explicit resource model
