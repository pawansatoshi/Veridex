# Veridex Master Roadmap

## North Star

Build the most credible **verifiable on-chain intelligence Miner** in the Telegraph ecosystem: deterministic where possible, explicit about uncertainty, resilient under infrastructure failure, proxy-aware, fast enough to compete on canonical performance, and polished enough to become a real developer product.

## Winning Thesis

Telegraph's current hackathon rules say the Miner track is primarily a performance competition within each Intent: 75% normalized performance and 25% X engagement/transparency. The rules also emphasize on-chain intelligence, autonomous agents, multi-intent intelligence, confidence thresholds, signal verification, and persistent intelligence.

Therefore the roadmap optimizes in this order:

1. correctness
2. evaluation alignment
3. latency/reliability
4. real utility and demand
5. UX/product quality
6. differentiation and brand
7. transparent growth

## Phase Map

| Phase | Name | Status | Exit condition |
|---|---|---|---|
| 0 | Constitution & continuity | 🟢 active | all persistent docs exist and agents can resume safely |
| 1 | EVM analysis core | ⏳ | deterministic checks + evidence contract + tests |
| 2 | Proxy-aware composition | ⏳ | correct implementation/state semantics including supported beacon path |
| 3 | Intelligence engine | ⏳ | normalized, explainable machine result |
| 4 | Telegraph Miner | ⏳ | verified official Intent/Miner contract and live endpoint |
| 5 | Evaluation & performance | ⏳ | benchmarked canonical performance and failure budgets |
| 6 | Application/UI | ⏳ | production-quality interactive analysis experience |
| 7 | Brand/demo | ⏳ | judge-ready product narrative and live proof |
| 8 | Hackathon operations | ⏳ | live through Track 3 with legitimate usage |
| 9 | Post-hackathon | ⏳ | durable platform roadmap |

## Phase 0 — Constitution & Continuity

- [x] repository created
- [x] Veridex positioning established
- [x] persistent state file
- [x] agent operating contract
- [x] Claude context
- [x] roadmap
- [x] architecture blueprint
- [x] decision log
- [x] Telegraph reference map
- [x] UI/UX blueprint
- [ ] phase-specific implementation docs

## Phase 1 — EVM Analysis Core

### Transport

- [ ] resilient JSON-RPC client
- [ ] request timeout
- [ ] circuit breaker with application-level error classification
- [ ] provider configuration and validation
- [ ] concurrency limits

### Evidence

- [ ] strict address validation
- [ ] bytecode validation
- [ ] ABI model
- [ ] evidence provenance
- [ ] detection method
- [ ] fallback reason/detail
- [ ] structured error semantics

### Ownership

- [ ] direct ownership inspection
- [ ] renounced ownership detection
- [ ] expected non-applicable behavior
- [ ] proxy delegatecall semantics test

### Proxy

- [ ] supported proxy pattern detection
- [ ] implementation resolution
- [ ] beacon detection
- [ ] explicit unresolved implementation state
- [ ] proxy evidence graph

### Capabilities

- [ ] pause capability
- [ ] live paused-state read
- [ ] mint capability
- [ ] mint authority evidence
- [ ] ABI-first exact signature detection
- [ ] bytecode fallback only when stronger evidence unavailable
- [ ] selector-clash regression coverage
- [ ] instruction-boundary regression coverage

## Phase 2 — Proxy-Aware Composition

Principle:

> capability detection uses the correct code address; live state uses the original contract/storage context.

Implement only after experimental verification of the required EVM/proxy assumptions.

### Required paths

1. direct contract → direct code/state
2. transparent/UUPS proxy → implementation code + proxy state
3. beacon proxy → beacon contract → implementation code + proxy state, if supported
4. proxy detected but implementation unavailable → explicit degraded result
5. malformed/unreachable implementation → explicit failure provenance

### Exit tests

- proxy ownership delegatecall behavior
- implementation capability inspection
- proxy live-state preservation
- beacon resolution behavior
- no silent fallback from unresolved proxy to misleading direct analysis

## Phase 3 — Contract Intelligence Engine

The engine turns independent evidence into a normalized contract intelligence object.

### Result layers

```text
identity
  ├── requested address
  ├── chain
  └── code address

proxy
  ├── detected
  ├── type
  ├── beacon
  └── implementation

checks
  ├── ownership
  ├── pause
  ├── mint
  └── future checks

evidence
  ├── source
  ├── ABI
  ├── bytecode
  ├── RPC state
  └── external dependency status

quality
  ├── confidence
  ├── detection method
  └── fallback provenance
```

Do not create a complex risk score until the Telegraph Intent/evaluation contract requires it.

## Phase 4 — Telegraph Miner

### Before implementation

- verify official Miner lifecycle
- verify current YAML/configuration requirements
- verify registration requirements
- verify exact Intent request/response contract
- verify x402 path required for the chosen integration
- verify current official contract addresses from official sources

### Miner responsibilities

- validate request
- enforce deadline/timeout budget
- resolve chain/network
- run deterministic analysis
- return canonical machine-readable result
- expose health/readiness
- expose useful diagnostics without leaking secrets
- remain operational throughout Track 3

## Phase 5 — Evaluation & Performance

### Benchmark dimensions

- canonical correctness
- deterministic repeatability
- p50/p95/p99 latency
- provider failure rate
- timeout rate
- false-positive rate
- false-negative rate
- cache effectiveness where safe
- concurrency behavior

### Adversarial corpus

Include:

- non-proxy contracts
- transparent proxies
- UUPS proxies
- beacon proxies
- unverified contracts
- verified contracts
- selector collisions
- PUSH-data selector decoys
- malformed bytecode
- RPC revert responses
- Etherscan API failures
- missing API configuration
- contracts without expected functions
- contracts with multiple capability paths

## Phase 6 — Application & UI/UX

### Primary journey

```text
landing
  ↓
enter contract
  ↓
select/confirm chain
  ↓
Analyzing...
  ↓
proxy resolution
  ↓
implementation verification
  ↓
capability checks
  ↓
evidence synthesis
  ↓
Veridex result
```

### Core screens

1. Landing / value proposition
2. Analyze contract
3. Live analysis timeline
4. Contract intelligence dashboard
5. Evidence explorer
6. Proxy graph
7. Check details
8. Confidence/provenance panel
9. Raw machine-readable result
10. Telegraph Miner/API information

### Motion principle

Every animation represents a real state transition. Use subtle graph pulses, evidence arrival, implementation-link animation, verification badges, and progressive disclosure. No fake progress bars.

## Phase 7 — Brand & Demo

### Brand

**VERIDEX**

Tagline: **Verifiable On-Chain Intelligence**

Brand attributes:

- precise
- technical
- trustworthy
- modern
- infrastructure-grade
- calm rather than hype-driven

### Demo narrative

1. Start with a real contract.
2. Show proxy detection.
3. Show implementation resolution.
4. Show verified ABI evidence.
5. Show capability evidence.
6. Show provenance and confidence.
7. Show deterministic machine result.
8. Show Telegraph Miner interface.
9. Show performance/latency proof.
10. Show how an agent can consume the result.

## Phase 8 — Hackathon Operations

Track 1 Miner window currently listed by official rules: **Aug 17–Aug 31, 2026**.
Track 3 applications: **Aug 31–Sep 7, 2026**.

Operational checklist:

- [ ] register Miner
- [ ] confirm chosen Intent
- [ ] confirm evaluation behavior
- [ ] deploy production endpoint
- [ ] monitor latency/errors
- [ ] obtain legitimate application usage
- [ ] remain live through Track 3
- [ ] publish meaningful tagged X updates
- [ ] avoid artificial metric inflation
- [ ] final submission/demo

## Phase 9 — Post-Hackathon

- additional contract-risk capabilities
- source/AST analysis if justified
- multi-chain strategy
- persistent signal feeds
- MCP integration
- SDK
- agent integrations
- enterprise API
- historical contract intelligence

## Never-Do List

- never fabricate an official address
- never treat RPC reverts as outages
- never use selector scanning as stronger evidence than verified ABI/source
- never claim beacon implementation resolution without actually resolving it
- never hide fallback reasons
- never build scoring math before understanding evaluation requirements
- never sacrifice correctness for visual effects
- never fake live usage or engagement
