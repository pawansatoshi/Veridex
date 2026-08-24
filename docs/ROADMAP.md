# Veridex Master Roadmap

## North Star

**Veridex — Verifiable On-Chain Intelligence:** evidence-backed capability intelligence for contracts and addresses, exposed as a deterministic service that applications and agents can consume.

> Know what a smart contract can do — and know when its powers change.

> No evidence → no certainty.

---

# CURRENT PHASE — H1 OPERATIONAL / SUBMISSION HARDENING

**Repository state reviewed:** 24 Aug 2026  
**Track 1/2:** 17–31 Aug 2026  
**Track 3:** 31 Aug–7 Sep 2026  
**H1 final boundary:** 7 Sep 2026

The repository is materially ahead of the original H1 build roadmap. The deterministic Miner core, proxy composition, Capability Passport, Continuous Watch domain layer, evaluation harness, production endpoint, and Telegraph registration are implemented. The current engineering priority is therefore **verification and operational hardening**, not adding another feature family.

The latest repository evidence records registration **#144 / FRAUD_DETECTION** for Miner `1001`. The current main commit has not been independently observed with a fresh blocking GitHub Actions run through the available connector, so prior green CI evidence must not be relabeled as current-commit green.

## Current execution gates

| Gate | Status | Next action |
|---|---|---|
| Deterministic analysis core | COMPLETE | Regression maintenance only |
| Proxy-aware composition | COMPLETE / CI-GATED | Maintain regression corpus |
| Capability Passport | COMPLETE / CI-GATED | Post-H1 persistence only |
| Continuous Watch domain layer | COMPLETE / CI-GATED | Durable scheduler/store remains deployment work |
| Ground-truth evaluator | COMPLETE | Expand real-chain corpus only when independently verified |
| Production Miner | LIVE | Keep endpoint stable |
| Telegraph YAML | IMPLEMENTED | Exact Intent gate now enforced |
| Telegraph registration | #144 recorded | Reconcile live registry and capture fresh evidence |
| Current-commit CI | NOT INDEPENDENTLY VERIFIED | Run/observe complete blocking gate |
| Track 1 package | READY TO HARDEN | Freeze claims to verified evidence |
| Track 3 application | NOT YET IN SCOPE | Begin only after Track 1/2 close |

## Highest-value next work

1. Verify live Telegraph registry state for Miner `1001` and `FRAUD_DETECTION`.
2. Run the complete blocking CI gate on the post-hardening commit.
3. Preserve fresh real-chain, resilience, benchmark and schema artifacts.
4. Finalize the Track 1 evidence package without claiming ranking or demand that has not been independently observed.
5. Keep the Miner live and stable through the Track 3 operational window.

Do not start broad UI, mobile, alerting or multi-chain semantic work while these gates are open.

---

# H1 CAPABILITY SCOPE

The initial capability matrix remains deliberately narrow:

1. **Ownership / control**
2. **Upgradeability / proxy surface**
3. **Pause capability / state**
4. **Mint capability / authority where evidence permits**

Do not expand the matrix merely to increase feature count.

## Address semantics

```text
requestedAddress → caller input
contractAddress  → live state/storage context
codeAddress      → bytecode/ABI inspection context
implementationAddress → resolved implementation when applicable
beaconAddress     → resolved beacon contract when applicable
```

Caller-provided `codeAddress` is an analysis hint, not canonical evidence. Production claims must remain grounded in independently resolved on-chain composition and verification evidence.

---

# EVIDENCE CONTRACT

```text
Tier 1 — verified ABI / verified source
Tier 2 — supported verified structural evidence
Tier 3 — instruction-boundary bytecode fallback
```

Every capability preserves provenance, detection method, confidence, conclusive state and failure context. Selector presence alone is not semantic proof. Provider failure is never a contract-negative result.

---

# RESILIENCE / SECURITY GATES

- strict address and bytecode validation
- bounded parser/network work
- instruction-boundary scanning
- malformed bytecode/ABI handling
- RPC timeout and bounded retry
- circuit breaker with application-revert separation
- provider/API failure classification
- bounded concurrency and request coalescing
- no secrets in client bundles
- dependency/CI security checks
- no unsupported evidence promoted to canonical fact

---

# TELEGRAPH INTEGRATION

Telegraph is the distribution/evaluation boundary, not the domain truth source.

Current Miner identity:

```text
Miner ID: 1001
Slug: veridex-contract-risk-miner
Registration: #144
Intent: FRAUD_DETECTION
Network: Base Sepolia
Production: https://veridex-ecru.vercel.app
```

The repository now enforces an **exact one-Intent contract** for the Veridex Miner: the configured and live-advertised Intent must be `FRAUD_DETECTION`, and that Intent must be canonical in Telegraph's live registry. This closes a previous verification gap where any canonical Intent could have satisfied the integration gate.

Official Telegraph material describes Miners as wrappers around APIs/models/datasets/tools and the YAML standard uses `semantics.supported_intents` to declare supported Intents. Veridex follows that contract.

Never claim live registry alignment until the live registry check passes.

---

# EVALUATION / PERFORMANCE

The production engine and evaluation harness remain separate:

```text
production engine → normalized result
                         ↑
curated ground truth → evaluator → TP/TN/FP/FN/inconclusive
```

Measure, never invent:

- accuracy / quality score
- evidence coverage
- conclusive rate
- false positives / false negatives
- end-to-end latency
- RPC / verification / analysis / serialization latency
- p50 / p95 / p99
- timeout/error rate
- cache and coalescing behavior

Prior repository evidence recorded a perfect deterministic evaluation and successful production benchmark. Those numbers are historical evidence, not a substitute for re-running the gate after a new main-branch change.

---

# POST-H1 ROADMAP

These items remain strategically important but must not block H1 operational readiness.

### Capability Passport persistence
Durable identity, historical observations and long-lived evidence storage.

### Change Intelligence / Time Machine
Persistent snapshots, capability diffs, implementation changes and evidence-quality changes.

### Policy Engine
`COMPLIANT / VIOLATION / INCONCLUSIVE` outcomes over capability state.

### Alerts
Observation → Diff → Policy → Alert Event → Notification Router → Email/Webhook/Mobile.

### Wallet Safety
Approval, allowance, spender and transaction-risk intelligence with explicit coverage limits.

### Multi-Chain Semantic Intelligence
Dedicated chain analyzers only after chain-specific evidence models, ground truth and regression suites exist.

### Product Application
Premium analyzer UX, accessibility, localization, PWA and account/product surfaces.

### 3D Contract Core
Evidence-backed visualization of the analysis lifecycle; never decorative certainty.

### Agents / SDK / MCP / Enterprise
Machine-consumable APIs, SDKs, MCP and policy tooling.

### Native Mobile
Push notifications and native mobile security controls.

---

# PRODUCT PILLARS

1. **UNDERSTAND** — What is this contract/address?
2. **VERIFY** — Why should I believe the result?
3. **DISCOVER POWERS** — What can this contract do?
4. **WATCH** — What changes after I leave?
5. **CONNECT** — Can humans, applications, agents and Telegraph consume this intelligence?

**H1:** Understand + Verify + Discover Powers + Connect.  
**Post-H1:** Watch becomes the persistent product layer.

---

# NEVER DO

- never invent a Telegraph Intent
- never accept any canonical Intent as a substitute for the intended Veridex mapping
- never treat selector bytes as semantic proof
- never treat provider failure as a contract negative
- never claim unsupported multi-chain semantic analysis
- never fabricate Track 3 demand, ranking, users or performance
- never let website polish outrank Miner correctness
- never reopen completed phases without new evidence
