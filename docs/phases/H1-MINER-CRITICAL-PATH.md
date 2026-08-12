# H1 Miner Critical Path

## Objective

Build a real, deterministic, measurable and reliable Veridex Miner for Telegraph Hackathon 1 while preserving the full post-H1 Veridex product architecture.

## Timeline

- **Aug 13–16, 2026:** foundation sprint
- **Aug 17–31, 2026:** Miner Track build/submission window
- **Aug 31–Sep 7, 2026:** Applications/Agents consume live Miners
- **Sep 7, 2026:** H1 final boundary

Official dates and judging rules must be re-verified from the current Telegraph rules before protocol-specific implementation.

## H1 Product Question

> What important capabilities does this smart contract expose, and what evidence supports that conclusion?

## H1 Scope

### Capability 1 — Ownership / control

Determine ownership/control only when evidence supports it. Expected non-Ownable behavior must remain distinct from provider failure or insufficient evidence.

### Capability 2 — Upgradeability / proxy surface

Detect supported proxy semantics and preserve:

- `contractAddress` for live state/storage
- `codeAddress` for capability/code inspection

A beacon address is never treated as an implementation. If implementation resolution is unavailable, return an honest inconclusive/unsupported result.

### Capability 3 — Pause

Determine pause capability and live paused state where evidence supports the conclusion.

### Capability 4 — Mint

Determine mint capability. Mint authority must remain explicitly unknown/inconclusive where the available evidence cannot prove the controlling authority.

## Evidence hierarchy

```text
Tier 1: verified ABI / verified source
Tier 2: verified source / structural analysis where supported
Tier 3: instruction-aligned bytecode fallback
```

Bytecode fallback must not override stronger verified ABI evidence.

## Required failure taxonomy

Keep these distinct:

- `not_configured`
- `unverified_contract`
- `api_failure`
- `timeout`
- `malformed_response`
- `insufficient_evidence`
- `conclusive_positive`
- `conclusive_negative`
- `inconclusive`
- application-level contract revert
- provider/network failure

## Runtime foundation

- [ ] strict runtime/configuration validation
- [ ] resilient JSON-RPC client
- [ ] timeout
- [ ] bounded retry
- [ ] circuit breaker
- [ ] application-level revert classification
- [ ] provider/rate-limit failure classification
- [ ] bounded concurrency
- [ ] deterministic telemetry abstraction

## Input / bytecode safety

- [ ] strict EVM address validation
- [ ] strict `0x`/hex/even-length validation
- [ ] bounded bytecode size
- [ ] instruction-aligned EVM walker
- [ ] PUSH1–PUSH32 operand handling
- [ ] selector extraction only at valid instruction boundaries
- [ ] malformed/truncated PUSH handling
- [ ] malformed ABI handling

## Evidence / verification

- [ ] verified ABI/source provider abstraction
- [ ] provider configuration validation
- [ ] unverified vs unconfigured vs API failure distinction
- [ ] evidence provenance
- [ ] detection method
- [ ] fallback reason/detail
- [ ] queried address
- [ ] code address
- [ ] provider status
- [ ] conclusive/inconclusive state

## Checks

- [ ] ownership
- [ ] expected non-Ownable behavior
- [ ] proxy surface
- [ ] implementation context where safely resolvable
- [ ] pause capability/state
- [ ] mint capability/authority
- [ ] ABI-first exact signature detection
- [ ] bytecode fallback

## Ground truth

Create a curated corpus containing:

- Ownable
- non-Ownable
- Pausable
- non-Pausable
- mintable
- non-mintable
- direct contracts
- supported proxy contracts
- verified contracts
- unverified contracts
- selector collisions
- PUSH-data selector decoys
- malformed bytecode fixtures
- RPC revert fixtures
- provider/API failure fixtures

Track:

- true positives
- true negatives
- false positives
- false negatives
- inconclusive cases
- latency
- provider failure behavior

## Telegraph integration

Before coding the adapter:

1. re-check official Hackathon rules
2. inspect official supported-intents contract
3. verify exact request/response schema
4. verify Miner configuration/registration
5. verify payment/auth requirements if applicable
6. verify evaluation behavior
7. verify supported networks and official constants

The adapter owns Telegraph protocol concerns only. Ownership/proxy/pause/mint logic remains in Veridex core.

## Miner response

Return structured machine-readable intelligence. Conceptually:

```text
contract
chain
capabilities[]
evidence[]
quality / confidence semantics
conclusive state
detection method
provider status
metadata
```

The exact outer schema must follow the selected official Telegraph Intent.

## Performance

Measure:

- end-to-end latency
- RPC latency
- verification latency
- analysis latency
- serialization latency
- timeout/error rates
- cache/evidence reuse where applicable
- duplicate work/coalescing effectiveness

Required engineering constraints:

- bounded concurrency
- strict deadlines
- no unbounded retries
- reuse evidence inside a request
- safe cache freshness
- no unnecessary cloud/Vercel jobs

## Security

H1 must implement real controls for:

- hostile input
- malformed bytecode/ABI
- parser exhaustion
- network exhaustion
- RPC timeout/outage/rate limiting
- application-level revert classification
- provider failure not becoming contract evidence
- client data not becoming canonical evidence
- secret isolation
- dependency/CI basics

Future production web/mobile controls remain post-H1 but must preserve the same trust model.

## Required adversarial tests

- [ ] selector bytes inside PUSH data do not trigger false positives
- [ ] selector collision limitation is explicit
- [ ] malformed hex fails safely
- [ ] odd-length hex fails safely
- [ ] missing `0x` fails safely
- [ ] empty bytecode is classified safely
- [ ] truncated PUSH fails safely
- [ ] malformed ABI fails safely
- [ ] expected RPC revert does not open circuit
- [ ] repeated expected RPC reverts keep circuit CLOSED
- [ ] real network failures eventually open circuit
- [ ] timeout is distinct from contract revert
- [ ] API failure is distinct from unverified contract
- [ ] proxy code/state address semantics are preserved
- [ ] beacon address is not treated as implementation
- [ ] ownership/pause/mint positive and negative cases work
- [ ] Telegraph request/response validation works

## H1 exit gate

H1 Miner critical path is ready for Track 1 submission only when:

1. deterministic core checks have stable semantics
2. evidence provenance is auditable
3. infrastructure failures never become contract findings
4. adversarial tests pass
5. ground-truth corpus produces measured results
6. official Telegraph Intent schema is verified
7. Miner adapter passes protocol tests
8. live endpoint is operational
9. latency/reliability are measured
10. no post-H1 feature is being represented as implemented

H1 final operational boundary:

**Sep 7, 2026.**

## Explicit non-goals for H1

Do not block the Miner on:

- Capability Passport persistence
- Continuous Watch
- Capability Time Machine
- Policy Engine runtime
- email/webhooks/mobile
- native mobile
- final 3D website
- broad risk scoring
- dozens of extra capabilities
- broad multi-chain expansion

These remain preserved in the post-H1 roadmap.
