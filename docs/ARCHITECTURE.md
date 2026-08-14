# Veridex Architecture & H1 Blueprint

## 1. Architectural goal

Veridex separates deterministic on-chain intelligence from Telegraph transport, evaluation, persistence and presentation. Telegraph is a distribution/ranking surface; it must never become the domain truth source.

The system must remain useful if Telegraph changes an Intent, request envelope, pricing mechanism or transport.

---

## 2. H1 vs Post-H1 boundary

### H1 — Miner-first execution slice

```text
Telegraph request
      ↓
Veridex Miner adapter
      ↓
Address detection
      ↓
EVM wallet / contract gate
      ↓
RPC + verification evidence
      ↓
Proxy / code-address resolution
      ↓
Ownership / Upgradeability / Pause / Mint
      ↓
Evidence normalization
      ↓
Confidence + conclusive state
      ↓
Machine-readable response
      ↓
Telegraph ranking / real demand
```

### Post-H1 — Veridex platform

```text
Normalized intelligence
      ↓
Capability Passport
      ↓
Persistent Watch observations
      ↓
Capability Diff / Change Intelligence
      ↓
Policy Engine
      ↓
Alert Event
      ↓
Notification Router
   ┌──┼───────┐
 Web Email Webhook Mobile
      ↓
Agents / SDK / MCP / Telegraph applications
```

Post-H1 architecture remains documented, but future features are not to be represented as H1 implementation.

---

## 3. Correct Miner mental model

A Telegraph Miner is a wrapped **API, model, dataset or tool** that supplies intelligence to the network. Therefore Veridex does not need to turn its entire domain engine into Telegraph-specific code.

The correct composition is:

```text
Veridex Intelligence Core
        ↑
Telegraph Miner Adapter
        ↑
Telegraph request/response contract
```

The core remains deterministic and independently testable. The adapter translates only the protocol envelope and lifecycle requirements.

---

## 4. Telegraph integration gates

The current integration surface presents three paths:

### Track 1 — Connect API / Miner

**Critical.** Connect the deployed Veridex API, produce the required Miner configuration, register it through the official flow and verify real requests.

### Track 2 — Submit WASM

**Optional secondary path.** A deterministic evaluation script can be authored when the applicable Intent/category and evaluation contract are verified. Track 2 must not delay Track 1.

### Track 3 — Consume Intelligence

**Post-Track-1/2.** Real applications and agents consume live Miners. Veridex should remain available and measurable during this window.

### Intent rule

The supported Intent registry is authoritative. Do not select an unrelated Intent because it happens to be available in the UI. If no legitimate capability-intelligence Intent exists, obtain an official answer from Telegraph before locking the adapter mapping.

Until verified, the adapter remains schema-neutral.

---

## 5. H1 request pipeline

```text
Telegraph request
   ↓
validate envelope
   ↓
extract address + declared chain/context
   ↓
detect address family
   ├── invalid/unknown → structured input result
   ├── known non-EVM → identify family + unsupported semantic analysis
   ├── EVM wallet → wallet result + stop contract analysis
   └── EVM contract → continue
   ↓
resolve verification evidence
   ↓
resolve proxy/code context
   ↓
run independent capability checks
   ├── ownership
   ├── upgradeability
   ├── pause
   └── mint
   ↓
normalize observations
   ↓
quality/confidence/conclusive state
   ↓
serialize stable Miner response
```

---

## 6. Address semantics

Never conflate:

- `requestedAddress` — caller input
- `contractAddress` — live storage/state context
- `codeAddress` — bytecode/ABI inspection context
- `implementationAddress` — proxy implementation
- `beaconAddress` — beacon contract

For delegatecall proxies:

```text
requestedAddress = proxy
contractAddress  = proxy
codeAddress      = implementation
```

For beacon proxies, implementation is populated only after an actual validated beacon implementation resolution. If resolution fails, return an explicit unresolved/inconclusive state.

Multi-chain format recognition is intentionally separate from semantic analysis. A Sui/Solana/Bitcoin/etc. address may be recognized without pretending Veridex can yet scan that chain's smart-contract semantics.

---

## 7. H1 evidence hierarchy

```text
Tier 1 — verified ABI / verified source
       ↓
Tier 2 — supported verified structural evidence
       ↓
Tier 3 — instruction-boundary bytecode fallback
```

Bytecode fallback must walk real EVM instruction boundaries. PUSH payload bytes are data and cannot independently produce selector findings. Malformed/truncated bytecode is rejected safely.

---

## 8. Capability contract

Every H1 capability result contains, directly or through normalized evidence:

```text
capability
result
contractAddress
codeAddress (when applicable)
chain
method / evidence tier
evidence
verification state
confidence
conclusive
fallback reason
provider/API status
observation metadata
```

The four initial capabilities are deliberately narrow:

- ownership/control
- upgradeability/proxy surface
- pause capability/state
- mint capability/authority

A positive finding requires evidence appropriate to the claim. Function existence alone is not proof of authorization or current state.

---

## 9. Failure semantics

Separate:

- invalid input
- wallet/non-contract
- application-level contract revert
- provider not configured
- unverified contract
- provider/API failure
- rate limit
- timeout
- malformed response
- unsupported proxy
- unresolved implementation
- insufficient evidence
- conclusive positive
- conclusive negative
- inconclusive
- internal error

Expected contract-level reverts **do not** count as provider failures and must not trip the circuit breaker.

---

## 10. Resilience

Shared RPC/verification infrastructure provides:

- strict timeout
- bounded retry for retryable infrastructure failures
- circuit breaker
- rate-aware handling
- explicit health state
- safe fallback only when semantics permit
- bounded concurrency
- duplicate request coalescing
- production cache with explicit freshness semantics

No provider outage may become a false contract finding.

---

## 11. Security boundary

H1 security includes:

- strict address/hex/ABI/bytecode validation
- bounded parser work
- bounded network work
- instruction-boundary scanning
- malformed input handling
- RPC timeout/retry/circuit breaker
- application/infrastructure error separation
- no client data as canonical evidence
- no secrets in client bundles/responses
- dependency and CI security checks
- adversarial regression tests

Post-H1 adds account security, authz, WAF, SSRF controls, webhook replay protection, email abuse controls and other product-edge security.

---

## 12. Ground-truth and evaluation

Production analysis and evaluation are independent:

```text
production engine ─────────→ normalized result
                                ↑
curated ground truth ─→ evaluator → TP/TN/FP/FN/inconclusive
```

Corpus requirements:

- Ownable / non-Ownable
- pausable / non-pausable
- mintable / non-mintable
- direct / proxy
- transparent/UUPS patterns where safely supported
- beacon resolved/unresolved
- verified/unverified
- selector collision fixtures
- PUSH-data decoys
- malformed bytecode
- RPC reverts
- provider failures

No hidden test-specific production branches.

---

## 13. Performance

```text
validate
  ↓
resolve only required context
  ↓
fetch prerequisite evidence
  ↓
parallelize independent checks
  ↓
normalize
  ↓
serialize
```

Measure:

- end-to-end latency
- RPC latency
- verification latency
- analysis latency
- serialization latency
- p50/p95/p99
- failure rate
- cache hit rate
- coalescing effectiveness

Do not add unnecessary cloud infrastructure during H1.

---

## 14. Telegraph adapter boundary

The adapter owns:

- verified Intent mapping
- request/response envelope
- Miner lifecycle/configuration
- authentication/payment path where required
- deadline handling
- request-level telemetry

The domain engine owns:

- address semantics
- proxy resolution
- evidence
- capability checks
- normalized result

The adapter must never implement smart-contract detection logic.

---

## 15. Post-H1 Capability Platform

### Capability Passport

Canonical representation of chain, contract/code identity, proxy posture, ownership, upgradeability, pause, mint, verification, evidence provenance, confidence, observation timestamp/block and schema version.

### Watch

```text
shared observation
      ↓
capability diff
      ↓
subscriber policies
```

Watch must deduplicate observations and never emit a change merely because a provider failed.

### Policy

```text
capability state + policy
        ↓
COMPLIANT / VIOLATION / INCONCLUSIVE
```

### Alerts

```text
Observation
 → Capability Diff
 → Policy
 → Alert Event
 → Notification Router
 → Email / Webhook / Mobile
```

Email is first-class; mobile is later. The router remains channel-agnostic.

---

## 16. Multi-chain roadmap

### H1

Recognize common address families and safely distinguish unsupported semantic analysis from EVM contract analysis.

### Post-H1

Add dedicated semantic adapters for Solana, Sui/Move, Aptos, Bitcoin, Cardano, Cosmos and other ecosystems only when each has:

- chain-specific RPC/indexing source
- evidence model
- capability semantics
- ground-truth corpus
- performance budget
- regression suite

No cross-chain byte-pattern guessing.

---

## 17. Wallet Safety roadmap

Wallet safety is a separate post-H1 capability family, not a reason to turn the H1 Miner into a generic wallet scanner.

Future checks may include:

- token approvals
- allowance/spender exposure
- permit signatures
- operator approvals
- contract risk signals
- transaction simulation

Unlimited approval is a **risk signal**, not proof of maliciousness. Coverage must state its indexing/freshness limits.

---

## 18. Product UX boundary

The future brand architecture keeps:

1. UNDERSTAND
2. VERIFY
3. DISCOVER POWERS
4. WATCH
5. CONNECT

Future hero:

> **Know what a smart contract can do.**
>
> **Know when its powers change.**

The current website is a proof surface for the H1 Miner. Localization, premium motion, 3D Contract Core and broad product navigation are post-H1 polish unless they directly improve Miner demonstration.

---

## 19. Architecture evolution

```text
                    ┌───────────────────────┐
                    │   Telegraph Miner     │
                    └───────────┬───────────┘
                                ↓
                    ┌───────────────────────┐
                    │ Veridex Intelligence  │
                    │       Core            │
                    └───────────┬───────────┘
                                ↓
              ┌─────────────────┼─────────────────┐
              ↓                 ↓                 ↓
        Passport             Watch            Policy
              ↓                 ↓                 ↓
              └─────────────────┼─────────────────┘
                                ↓
                       Alert / Intelligence
                                ↓
                 Web / Mobile / Agents / SDK
```

The core is the durable asset. Telegraph is a current distribution surface; Web/Mobile/Agents are future consumers.

---

## 20. Architecture decision rules

Before any new feature becomes H1 scope, it must answer:

1. Does it improve the real Miner?
2. Does it improve correctness or measurable performance?
3. Is its evidence model explicit?
4. Is there a regression corpus?
5. Does official Telegraph protocol support the integration path?
6. Can it ship without destabilizing existing capability checks?

If not, it belongs POST-H1.
