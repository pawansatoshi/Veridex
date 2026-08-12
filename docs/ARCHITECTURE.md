# Veridex Detailed Architecture Blueprint

## 1. Architectural Goal

Veridex is a layered system that separates deterministic contract observation from orchestration, Telegraph transport, evaluation, and presentation. The core must remain useful even if Telegraph changes an Intent or transport mechanism.

```text
                    ┌──────────────────────────────┐
                    │        Veridex Web UI         │
                    │ visual analysis + evidence    │
                    └──────────────┬───────────────┘
                                   │ normalized result/events
                    ┌──────────────▼───────────────┐
                    │     Veridex Product API       │
                    │ request policy + UX adapter   │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │      Analysis Orchestrator    │
                    │ chain → proxy → checks →     │
                    │ evidence → normalized result │
                    └───────┬───────────┬──────────┘
                            │             │
               ┌────────────▼───┐   ┌────▼─────────────┐
               │ Proxy Resolver │   │ Check Modules    │
               │ implementation │   │ ownership        │
               │ beacon path    │   │ pause            │
               │ proxy evidence │   │ mint             │
               └───────┬────────┘   └────┬─────────────┘
                       │                  │
                       └────────┬─────────┘
                                ▼
                    ┌─────────────────────────┐
                    │ Evidence / Provenance   │
                    │ ABI / source / bytecode │
                    │ RPC / external status   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │ Normalized Intelligence │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┴────────────────┐
                ▼                                 ▼
        Telegraph Adapter                    Product API
                │                                 │
                ▼                                 ▼
           Telegraph                        Web / Agents

             ┌─────────────────────────────────────┐
             │ Evaluation Harness / Ground Truth   │
             │ independent from production logic   │
             └─────────────────────────────────────┘
```

## 2. Core architectural principles

1. Evidence before interpretation.
2. Deterministic observation before probabilistic reasoning.
3. Explicit address semantics.
4. Infrastructure failure must never become a contract finding.
5. Every fallback is observable.
6. Core analysis is independent of Telegraph transport.
7. Evaluation code is independent of production scoring/analysis.
8. UI consumes backend truth; it does not invent security conclusions.
9. Network work is bounded, measurable and minimized.
10. New capabilities require a real use case, evidence contract, and regression corpus.

## 3. Trust boundaries

### External inputs

- contract address
- requested chain/network
- Telegraph request metadata
- RPC responses
- verified ABI/source API responses
- bytecode
- optional provider metadata

Every external input is untrusted until validated.

### Internal trust model

The analysis engine does not trust an external explanation to establish a contract fact. Facts are tied to evidence objects with source and address provenance.

## 4. Address model

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

## 5. Evidence hierarchy

For capability/function existence:

```text
Tier 1: verified ABI
       ↓
Tier 2: verified source / AST (future, only if justified)
       ↓
Tier 3: instruction-aligned bytecode fallback
```

Selector presence alone does not prove semantic identity because different signatures can collide on four bytes.

Every finding must preserve the method/tier that produced it.

## 6. Error semantics

Classify at least:

- invalid caller input
- contract/data state
- expected application-level RPC revert
- external API unavailability
- external API rate limit
- timeout
- malformed external data
- unsupported proxy pattern
- unresolved implementation
- internal programming error

Expected contract behavior must not increment infrastructure circuit-breaker failure counters.

## 7. Proxy composition

The composition layer resolves **what should be inspected**; it does not score risk.

```text
requested contract
       │
       ▼
proxy detection
       │
 ┌─────┼───────────────┐
 │     │               │
none  implementation  beacon
 │     │               │
 │     ▼               ▼
 │   code address   beacon contract
 │                     │
 │                     ▼
 │              implementation()
 │                     │
 └──────────┬──────────┘
            ▼
     analysis context
```

If resolution fails, return explicit degraded evidence. Never silently inspect proxy bytecode as if it were the implementation.

## 8. Check module contract

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

## 9. Evidence object

Evidence should answer:

- what was observed?
- where was it observed?
- which address was queried?
- which address supplied code?
- which method detected it?
- what fallback occurred?
- did an external dependency fail?
- how confident is the observation?

Avoid fields added only for visual symmetry. Each field needs audit value or a downstream consumer.

## 10. Normalized result contract

The result supports both machine and human consumers:

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

## 11. Telegraph adapter boundary

The adapter owns:

- current official Intent mapping
- request/response protocol
- Miner lifecycle/configuration
- authentication/payment path where required
- deadline handling
- request-level observability

It must not contain ownership/proxy/mint/pause detection logic.

The adapter must be replaceable if Telegraph changes the selected Intent or transport.

## 12. Evaluation architecture

Production analysis and evaluation are separate systems.

```text
production engine ────────┐
                          ├──→ normalized result
versioned ground truth ──→ evaluator ──→ benchmark metrics
```

The evaluation harness may know expected answers; the production engine must not contain hidden test-specific branches.

Ground truth should cover:

- direct/non-proxy contracts
- transparent/UUPS proxies
- supported beacon proxies
- verified/unverified contracts
- expected-negative cases
- selector collisions
- PUSH-data decoys
- malformed data
- RPC reverts
- provider/API failures
- unavailable implementations

## 13. Performance architecture

Network calls dominate latency. Preferred request flow:

```text
validate
  ↓
resolve proxy
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
- reuse evidence inside a request
- cache only with explicit freshness semantics
- measure p50/p95/p99
- optimize after profiling

## 14. Analysis event model

The same normalized event model can drive observability and the UI without duplicating analysis logic.

Events include:

```text
INTAKE
CHAIN_RESOLUTION
PROXY_SCAN
IMPLEMENTATION_RESOLUTION
ABI_VERIFICATION
SOURCE_VERIFICATION
BYTECODE_FALLBACK
OWNERSHIP_CHECK
PAUSE_CHECK
MINT_CHECK
EVIDENCE_RECONCILIATION
RESULT_READY
```

Each event may carry start/end timestamps, status, evidence references, latency and degradation information. Sensitive provider credentials and secrets must never enter events.

## 15. UI architecture

```text
analysis events
      ↓
state machine
      ↓
visual timeline
      ↓
evidence graph
      ↓
result dashboard
```

Animation is a visualization of actual backend state transitions. No fake percentage completion.

## 16. Official contract registry

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

## 17. Product and domain separation

The domain should own concepts such as:

- analysis context
- evidence
- findings
- proxy resolution
- normalized result

Infrastructure owns:

- HTTP/RPC clients
- Etherscan or equivalent provider clients
- retries/timeouts/circuit breakers
- serialization

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

## 18. Future extension points

Potential modules:

- upgrade authority depth
- timelock/multisig analysis
- pause/mint/burn/blacklist capability analysis when reliable evidence exists
- source/AST access-control analysis
- historical change detection
- persistent signals
- MCP/SDK integrations
- multi-chain support

Each extension requires a real user need, evidence model, regression corpus, and performance measurement before becoming core.
