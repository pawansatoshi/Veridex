# Veridex Detailed Architecture Blueprint

## 1. Architectural Goal

Veridex is a layered system that separates deterministic contract observation from orchestration, Telegraph transport, and presentation.

```text
                    ┌──────────────────────────────┐
                    │        Veridex Web UI         │
                    │  visual analysis + evidence   │
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │      Veridex Application      │
                    │ API / Miner / request policy  │
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
                   ┌─────────────┴─────────────┐
                   ▼                           ▼
          Telegraph Miner                Product API
                   │                           │
                   ▼                           ▼
              Telegraph                  Web / Agents
```

## 2. Trust Boundaries

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

The analysis engine does not trust an external explanation to establish a contract fact. Facts should be tied to evidence objects.

## 3. Address Model

Never conflate these concepts:

- `requestedAddress`: address supplied by the caller
- `contractAddress`: address whose storage/live state is queried
- `codeAddress`: address whose bytecode/ABI is inspected
- `implementationAddress`: resolved implementation behind a proxy
- `beaconAddress`: beacon contract address

For a delegatecall proxy:

```text
requestedAddress = proxy
contractAddress  = proxy
codeAddress      = implementation
```

Live state calls must normally use the proxy context; code/ABI inspection may use the implementation.

For a beacon proxy:

```text
requestedAddress = proxy
contractAddress  = proxy
beaconAddress    = beacon
implementation   = beacon.implementation()
codeAddress      = implementation
```

Only set the implementation after it has actually been resolved and validated.

## 4. Evidence Hierarchy

For capability/function existence:

```text
Tier 1: verified ABI
       ↓
Tier 2: verified source / AST (future)
       ↓
Tier 3: instruction-aligned bytecode fallback
```

Selector presence alone does not prove semantic identity because multiple function signatures can collide on the 4-byte selector.

The system must expose which evidence tier produced a result.

## 5. Error Semantics

Classify failures into at least:

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

## 6. Proxy Composition

The composition layer is responsible for resolving what should be inspected, not for scoring risk.

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
     analysis target
```

If resolution fails, the result must say so. Never silently inspect proxy bytecode as though it were the implementation and present that as equivalent evidence.

## 7. Check Module Contract

Each check should accept an explicit context and return a normalized result.

Conceptually:

```ts
interface AnalysisContext {
  requestedAddress: string;
  contractAddress: string;
  codeAddress?: string;
  chain: string;
  proxy?: ProxyResolution;
}
```

Checks remain independently testable and should not know about Telegraph transport.

## 8. Evidence Object

Evidence should answer:

- what was observed?
- where was it observed?
- which address was queried?
- which address supplied code?
- what method detected it?
- what fallback occurred?
- did an external dependency fail?
- how confident is the observation?

Avoid adding fields merely for symmetry. Evidence fields should have a downstream consumer or clear audit value.

## 9. Normalized Result

The result should support both human and machine consumers:

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

The machine response must remain deterministic for identical on-chain/external inputs within a defined freshness window.

## 10. Telegraph Adapter Boundary

The Telegraph adapter owns:

- request/response protocol
- Intent mapping
- Miner lifecycle/configuration
- authentication/payment path where required
- deadline handling
- request-level observability

It must not contain ownership/proxy/mint/pause detection logic.

## 11. Performance Architecture

The Miner should minimize sequential network calls.

Preferred pattern:

```text
validate
  ↓
resolve proxy
  ↓
fetch required evidence
  ├── bytecode
  ├── ABI
  ├── state
  └── external metadata
  ↓
parallel independent checks
  ↓
normalize
  ↓
respond
```

Concurrency must be bounded. Caching must never cause stale evidence to be presented as live state without an explicit freshness policy.

## 12. UI Architecture

The UI consumes the same normalized result as an agent wherever practical.

```text
analysis event stream
      ↓
state machine
      ↓
visual timeline
      ↓
evidence graph
      ↓
result dashboard
```

The UI should not infer security conclusions independently from the backend.

## 13. Dynamic Analysis Animation

Animation states correspond to real backend events:

1. `INTAKE` — address accepted
2. `CHAIN_RESOLUTION`
3. `PROXY_SCAN`
4. `IMPLEMENTATION_RESOLUTION`
5. `ABI_VERIFICATION`
6. `SOURCE_VERIFICATION` when supported
7. `BYTECODE_FALLBACK` only when needed
8. `OWNERSHIP_CHECK`
9. `PAUSE_CHECK`
10. `MINT_CHECK`
11. `EVIDENCE_RECONCILIATION`
12. `RESULT_READY`

Each event can have:

- start time
- end time
- status
- evidence references
- latency
- error/degradation state.

This creates meaningful animation rather than decorative loading.

## 14. Official Contract Registry

Veridex will maintain an explicit registry for official Telegraph smart-contract addresses and protocol constants when the integration requires them.

Registry rules:

- source URL required
- network required
- address required
- verification date required
- purpose required
- ABI/reference required when relevant
- no address is copied from memory or an unofficial post
- stale addresses must be marked deprecated rather than silently replaced

The registry is an integration artifact, not a generic EVM constants dump.

## 15. Future Extension Points

Potential future modules:

- blacklist/sanctions intelligence only if a reliable standardized source exists
- ownership/admin role depth
- upgrade authority analysis
- pause/mint/burn/blacklist capabilities
- proxy admin analysis
- timelock/multisig analysis
- source/AST access-control analysis
- historical change detection
- persistent signals
- MCP interface

Each requires a separate evidence contract and benchmark before becoming part of the core Miner.
