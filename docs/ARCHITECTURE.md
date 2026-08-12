# Veridex Detailed Architecture Blueprint

## 1. Architectural Goal

Veridex is a layered system that separates deterministic contract observation from orchestration, Telegraph transport, evaluation, persistence, notification, and presentation. The core must remain useful if Telegraph changes an Intent or transport mechanism.

## 2. H1 vs Post-H1 boundary

H1 is intentionally a **Miner-first execution slice**, not the complete Veridex product.

```text
                         H1 MINER CORE

Telegraph Intent
      ↓
request validation
      ↓
chain / RPC
      ↓
verification evidence
      ↓
proxy / code-address context
      ↓
ownership / upgradeability / pause / mint
      ↓
evidence normalization
      ↓
conclusive / inconclusive result
      ↓
Telegraph adapter
      ↓
live Miner

                         POST-H1 PLATFORM

normalized intelligence
      ↓
Capability Passport
      ↓
shared Watch observations
      ↓
Capability Diff / Change Intelligence
      ↓
Policy Engine
      ↓
Alert Event
      ↓
Notification Router
      ├── Web
      ├── Email
      ├── Webhook
      └── Mobile Push
      ↓
Agents / SDK / MCP / Telegraph applications
```

Post-H1 concepts must remain architecturally represented but must not be mistaken for H1 implementation.

## 3. H1 critical pipeline

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

H1 capability scope is deliberately narrow:

- ownership / control
- upgradeability / proxy surface
- pause capability/state
- mint capability/authority where evidence permits

## 4. Core architectural principles

1. Evidence before interpretation.
2. Deterministic observation before probabilistic reasoning.
3. Explicit address semantics.
4. Infrastructure failure must never become a contract finding.
5. Every fallback is observable.
6. Core analysis is independent of Telegraph transport.
7. Evaluation code is independent from production analysis.
8. UI consumes backend truth; it does not invent security conclusions.
9. Network work is bounded, measurable and minimized.
10. New capabilities require a real use case, evidence contract, regression corpus, and performance measurement.
11. H1 prioritizes a real Miner over post-H1 UI breadth.

## 5. Trust boundaries

### H1 external inputs

- contract address
- requested chain/network
- Telegraph request metadata
- RPC responses
- verified ABI/source API responses
- bytecode
- optional provider metadata

Every external input is untrusted until validated.

### Post-H1 production boundaries

The future application architecture must evolve toward:

```text
Internet
  ↓
Edge / rate limiting / WAF
  ↓
Authentication
  ↓
Authorization
  ↓
Bounded API
  ↓
Analysis / Watch orchestration
  ↓
Domain engine
  ↓
Evidence store
  ↓
Policy Engine
  ↓
Notification Router
  ↓
Email / Webhook / Mobile
```

The exact production stack is deferred until the web/API phase; the H1 Miner must not expose secrets or accept client data as canonical evidence.

## 6. Address model

Never conflate:

- `requestedAddress`: caller supplied address
- `contractAddress`: address whose storage/live state is queried
- `codeAddress`: address whose bytecode/ABI is inspected
- `implementationAddress`: resolved implementation behind a proxy
- `beaconAddress`: beacon contract address

For delegatecall proxies:

```text
requestedAddress = proxy
contractAddress  = proxy
codeAddress      = implementation
```

Live state calls normally use proxy context; code/ABI inspection may use implementation context.

For a supported beacon proxy:

```text
requestedAddress = proxy
contractAddress  = proxy
beaconAddress    = beacon
implementation   = beacon.implementation()
codeAddress      = implementation
```

Only populate implementation after actual validated resolution.

If H1 cannot safely resolve a beacon implementation, return an honest unsupported/inconclusive state. Never inspect the beacon address as though it were the implementation.

## 7. Evidence hierarchy

For capability/function existence:

```text
Tier 1: verified ABI / verified source information
       ↓
Tier 2: verified source / structural analysis where actually supported
       ↓
Tier 3: instruction-aligned bytecode fallback
```

Selector presence alone does not prove semantic identity because different signatures can collide on four bytes.

Every finding must preserve method/tier, queried address, code address where relevant, fallback reason, provider status, and conclusive/inconclusive semantics.

## 8. Error semantics

At minimum distinguish:

- invalid caller input
- contract/data state
- expected application-level RPC revert
- external API not configured
- unverified contract
- external API failure
- external API rate limit
- timeout
- malformed external data
- unsupported proxy pattern
- unresolved implementation
- insufficient evidence
- conclusive positive
- conclusive negative
- inconclusive
- internal programming error

Expected contract behavior must not increment infrastructure circuit-breaker failure counters.

## 9. Resilience architecture

RPC and verification providers use a shared resilience abstraction rather than duplicated retry/timeout logic.

Required semantics:

- strict timeout
- bounded retry only for retryable transport/provider failures
- circuit breaker for infrastructure failures
- application-level contract reverts do not trip the breaker
- rate-limit awareness
- explicit provider health state
- safe fallback only when evidence semantics permit it
- no infrastructure failure → capability absence

Regression requirement:

```text
5 expected contract reverts → circuit remains CLOSED
real repeated network/provider failures → circuit eventually OPEN
```

## 10. Bytecode safety architecture

Bytecode is hostile input.

The scanner must:

- require valid `0x`-prefixed even-length hex
- enforce a maximum bytecode size
- walk actual EVM instruction boundaries
- treat PUSH1–PUSH32 operands as data
- never scan arbitrary byte offsets for selectors
- reject truncated PUSH instructions safely
- return structured errors instead of uncaught parser exceptions

Verified ABI/source evidence is always stronger than selector fallback.

## 11. Check module contract

Each check accepts an explicit context and returns a normalized result.

```ts
interface AnalysisContext {
  requestedAddress: string;
  contractAddress: string;
  codeAddress?: string;
  chain: string;
  proxy?: ProxyResolution;
}
```

Checks remain independently testable and know nothing about Telegraph transport.

## 12. Evidence object

Evidence should answer:

- what was observed?
- where was it observed?
- which address was queried?
- which address supplied code?
- which method detected it?
- what fallback occurred?
- did an external dependency fail?
- is the observation conclusive?
- what provider/API state affected the observation?

Avoid fields added only for visual symmetry. Each field needs audit value or a downstream consumer.

## 13. Normalized result contract

H1 requires a machine-readable result capable of supporting the Miner adapter and later clients:

```text
request
identity
proxy
checks[]
evidence[]
quality
errors[]
metadata
```

The result is deterministic for identical inputs and equivalent evidence within a declared freshness window.

The post-H1 Passport may persist compatible normalized observations, but Passport persistence is not an H1 prerequisite.

## 14. Telegraph adapter boundary

The adapter owns:

- current official Intent mapping
- request/response protocol
- Miner lifecycle/configuration
- authentication/payment path where required
- deadline handling
- request-level observability

It must not contain ownership/proxy/mint/pause detection logic.

Before implementation, the current official supported-intent request/response/evaluation contract must be verified. If the correct path is custom/other, that choice must be justified from official rules/docs.

## 15. Evaluation architecture

Production analysis and evaluation are separate systems.

```text
production engine ────────┐
                          ├──→ normalized result
versioned ground truth ──→ evaluator ──→ benchmark metrics
```

The evaluation harness may know expected answers; production analysis must not contain hidden test-specific branches.

H1 corpus should cover:

- Ownable
- non-Ownable
- pausable/non-pausable
- mintable/non-mintable
- direct/non-proxy
- transparent/UUPS proxy where safely supported
- verified/unverified contracts
- selector collisions
- PUSH-data decoys
- malformed bytecode
- RPC reverts
- provider/API failures
- unavailable implementations

## 16. Performance architecture

Network calls dominate latency.

```text
validate
  ↓
resolve required proxy context
  ↓
fetch prerequisite evidence
  ├── bytecode
  ├── ABI/source
  └── required state
  ↓
parallel independent checks
  ↓
normalize
  ↓
respond
```

Rules:

- bounded concurrency
- strict deadlines
- no unbounded retries
- reuse evidence within a request
- cache only with explicit freshness semantics
- coalesce duplicate work where justified
- measure p50/p95/p99
- optimize only after profiling

Do not add unnecessary Vercel/cloud jobs or expensive background infrastructure during H1.

## 17. H1 security boundary

H1 must implement real controls for:

- strict address/hex/bytecode/ABI validation
- bounded parser and network work
- RPC timeout/retry/circuit breaker
- failure classification
- no provider failure → contract finding
- no client data → canonical evidence
- no secrets in client-visible responses
- dependency/CI security basics
- adversarial regression coverage

Future API/web/mobile controls such as IDOR, authz, SSRF, XSS, webhook replay, email abuse and account security become explicit production milestones without changing the evidence trust model.

## 18. Post-H1 Capability Platform

After H1, the normalized intelligence result expands into:

```text
Capability Passport
      ↓
Shared Observation / Watch
      ↓
Capability Diff / Change Intelligence
      ↓
Capability Policy Engine
      ↓
Normalized Alert Event
      ↓
Notification Router
      ├── in-app
      ├── email
      ├── webhook
      └── mobile push
```

### Capability Passport

Canonical evolving representation of:

- chain/network
- contract address
- code address
- proxy status
- implementation
- ownership/control
- upgradeability
- pause
- mint
- verification
- evidence provenance
- detection method
- confidence/quality semantics
- observation timestamp/block
- conclusive/inconclusive state
- schema version

### Watch

One contract observation should support many subscribers:

```text
contract
  ↓
shared observation
  ↓
capability diff
  ↓
subscriber policies
```

Future Watch requires deduplication, adaptive polling, provider-health awareness, budgets, cooldowns, retention and no false change alerts from provider failure.

### Policy Engine

Dedicated post-H1 Phase 3.7. Outputs:

- `COMPLIANT`
- `VIOLATION`
- `INCONCLUSIVE`

No invented numerical security mathematics before calibration/evaluation data exists.

## 19. Product clients

The future platform exposes the same versioned intelligence contract to:

```text
Web
Mobile
Agents
Third-party API / SDK / MCP
Telegraph
```

Business logic remains outside mobile/web presentation code.

## 20. UX architecture

The future product retains five pillars:

1. UNDERSTAND
2. VERIFY
3. DISCOVER POWERS
4. WATCH
5. CONNECT

Future hero:

> **Know what a contract can do.**
>
> **Know when its powers change.**

The 3D Contract Core remains a post-H1 proof surface concept. Animation must represent real analysis events and never fabricate certainty.

## 21. Official contract registry

Veridex maintains an explicit registry for official Telegraph addresses/constants only when required by integration.

Each entry requires:

- source URL
- network
- address
- verification date
- purpose
- ABI/reference where relevant
- status

Unofficial or stale addresses are never silently promoted to production configuration.

## 22. Product/domain/infrastructure separation

The domain owns:

- analysis context
- evidence
- findings
- proxy resolution
- normalized result
- future Passport/Policy concepts

Infrastructure owns:

- HTTP/RPC clients
- verification provider clients
- retries/timeouts/circuit breakers
- serialization
- persistence adapters

Telegraph owns:

- Miner protocol integration
- Intent adapter
- payment/auth path
- lifecycle/configuration

Presentation owns:

- visual state
- interaction
- accessibility
- formatting

This prevents a provider or hackathon-specific integration from becoming the core product architecture.

## 23. Future extension points

Potential modules remain:

- Capability Passport
- persistent Watch
- capability change feeds
- timelock/multisig analysis
- pause/mint/burn/blacklist analysis when reliable evidence exists
- source/AST access-control analysis
- MCP/SDK integrations
- multi-chain support
- enterprise observability

Each extension requires a real user need, evidence model, regression corpus, and performance measurement before becoming core.
