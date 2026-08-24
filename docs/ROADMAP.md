# Veridex Master Roadmap

## North Star

**Veridex — Verifiable On-Chain Intelligence:** evidence-backed capability intelligence for contracts and addresses, exposed as a deterministic service that applications and agents can consume.

> Know what a smart contract can do — and know when its powers change.

> No evidence → no certainty.

---

# CURRENT PHASE — H1 OPERATIONAL / VERIFICATION & RELEASE FREEZE

**Repository state reviewed:** 24 Aug 2026  
**Track 1/2:** 17–31 Aug 2026  
**Track 3:** 31 Aug–7 Sep 2026  
**H1 final boundary:** 7 Sep 2026

The deterministic Miner core, proxy composition, Capability Passport, Continuous Watch domain layer, evaluation harness, production endpoint, Telegraph registration and complete Phase 05 UX release surface are implemented. Phase 05A–05E is closed. The next work is verification and release evidence, not feature expansion.

## Current execution gates

| Gate | Status | Next action |
|---|---|---|
| Deterministic analysis core | COMPLETE | Regression maintenance only |
| Proxy-aware composition | COMPLETE / CI-GATED | Maintain regression corpus |
| Capability Passport | COMPLETE / CI-GATED | Post-H1 persistence only |
| Continuous Watch domain layer | COMPLETE / CI-GATED | Durable scheduler/store remains deployment work |
| Ground-truth evaluator | COMPLETE | Expand real-chain corpus only when independently verified |
| Production Miner | LIVE | Keep endpoint stable |
| Telegraph YAML | IMPLEMENTED | Exact Intent gate enforced |
| Telegraph registration | #144 recorded | Reconcile live registry and capture fresh evidence |
| Phase 05 UX 05A–05E | COMPLETE | No further UX feature expansion before H1 freeze |
| Release QA static audit | IMPLEMENTED | Run on current main |
| Current-commit CI | NOT INDEPENDENTLY VERIFIED | Run/observe complete blocking gate |
| Track 1 evidence package | READY TO FREEZE | Add fresh verification artifacts |
| Track 3 application | NOT YET IN SCOPE | Begin only after Track 1/2 close |

## Highest-value next work

1. Run `npm run verify:release-qa` on current main.
2. Run the complete blocking verification lane on current main.
3. Verify live Telegraph registry state for Miner `1001` / `FRAUD_DETECTION`.
4. Preserve fresh real-chain, resilience, benchmark and production-schema artifacts.
5. Freeze the Track 1/H1 evidence package without claiming unverified ranking, demand or performance.
6. Keep the Miner stable through the Track 3 operational window.

**Do not start:** broad multi-chain semantic work, production alerting, decorative 3D, or major new product surfaces before these gates close.

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

The repository enforces an exact one-Intent contract for the Veridex Miner: the configured/live advertised Intent must be `FRAUD_DETECTION`, and that Intent must be canonical in Telegraph's live registry. Never claim live registry alignment until the live check passes.

---

# EVALUATION / PERFORMANCE

The production engine and evaluation harness remain separate. Prior perfect deterministic evaluation and benchmark numbers are historical evidence and must be reproduced after main-branch changes before being presented as current.

---

# POST-H1 ROADMAP

These remain strategically important but must not block H1 readiness:

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
