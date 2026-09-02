# Veridex — Telegraph Track 3 Roadmap & Blueprint

**Status:** ACTIVE BUILD PLAN  
**Track:** Telegraph H1 — Track 3 Applications  
**Window:** Aug 31–Sep 7, 2026  
**Repository:** `pawansatoshi/Veridex`

## 1. Mission

Turn the existing Veridex web application into a real Telegraph Track 3 application that consumes live Telegraph intelligence and converts it into an evidence-backed, confidence-aware on-chain risk decision.

**Product:** Veridex Intelligence Copilot  
**Positioning:** *From a contract address to an evidence-backed on-chain risk decision.*

Track 3 is an application/demand layer. It is **not** a requirement to embed the Track 2 WASM scorer into the website. Track 2 remains an independent CLI/WASM evaluation component and should stay frozen while its hidden-evaluation behavior is investigated.

## 2. Existing assets to preserve

Veridex already contains:

- deterministic EVM contract analysis
- proxy-aware analysis
- Capability Passport
- Continuous Watch foundations
- evidence explorer / provenance UI
- production Telegraph Miner
- `/telegraph/` hub
- `/telegraph/miner/` Track 1 surface
- `/telegraph/evaluation/` Track 2 surface
- `/telegraph/application/` Track 3 surface
- production deployment and existing responsive UI

Do **not** replace these with a new project. Extend the existing Veridex application.

## 3. Track separation

```text
Track 1 — SUPPLY
Veridex Miner
    ↓
provides intelligence to Telegraph

Track 2 — QUALITY
CLI / WASM scorer
    ↓
evaluates Miner answers

Track 3 — DEMAND / APPLICATION
Veridex web application
    ↓
consumes live Telegraph intelligence
    ↓
creates a useful user workflow
```

Track 2 is **not a frontend dependency** of Track 3.

## 4. Product architecture

```text
                         USER
                           │
                  Contract / Token / EVM
                           │
                           ▼
                 VERIDEX WEB APPLICATION
                           │
                    Orchestration API
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
   Deterministic      Telegraph         Evidence /
   EVM Analysis       Intelligence      Trace Store
          │                │
          │          ┌─────┴─────┐
          │          │           │
          │       Intent A    Intent B
          │          │           │
          │          ▼           ▼
          │       Live Miner  Live Miner
          │          │           │
          └──────────┼───────────┘
                     ▼
              Signal Normalizer
                     │
              Conflict Detector
                     │
               Evidence Fusion
                     │
             Confidence / State
                     │
                     ▼
               FINAL DECISION
                     │
             ┌───────┼────────┐
             ▼       ▼        ▼
            Risk   Evidence  Watch/Agent
```

## 5. Core user journey

### Step 1 — Identify

User enters an EVM contract address and, where needed, chain/network.

Reject malformed or unsupported input. Never guess.

### Step 2 — Deterministic analysis

Run existing Veridex analysis:

- contract identity
- proxy / implementation
- verified ABI where available
- ownership/admin control
- upgradeability
- pause capability
- mint capability
- other supported capability checks
- provider/analysis health

This is the hard-evidence layer.

### Step 3 — Telegraph intelligence

Use the current supported-intents catalog and current Telegraph integration API. Do not invent or assume intent names.

The application should request intelligence that complements deterministic EVM evidence rather than merely duplicating it.

### Step 4 — Normalize

Convert heterogeneous Telegraph responses into a common internal signal model:

```text
intent
provider/miner identity where exposed
request status
response
confidence if supplied
payment/request metadata
source/provenance
raw evidence reference
```

### Step 5 — Detect conflicts

Never blindly average contradictory signals.

Example:

```text
Telegraph signal A → high risk
Telegraph signal B → low risk
Veridex deterministic evidence → upgradeable + mintable

Final state → CONFLICTED / REVIEW REQUIRED
```

### Step 6 — Fuse evidence

Combine deterministic findings and Telegraph signals with explicit provenance. The fusion layer must distinguish:

- observed evidence
- external intelligence
- derived interpretation
- confidence/state

Do not manufacture certainty.

### Step 7 — Final result

Use explicit states:

- CONCLUSIVE
- HIGH CONFIDENCE
- MODERATE
- CONFLICTED
- INCONCLUSIVE
- UNAVAILABLE

A numeric confidence may be shown only when it has a defensible derivation.

## 6. Telegraph integration requirements

Track 3 must use **real Telegraph Miners**. No mock Miner responses, simulated traffic, fabricated demand, fabricated rankings, or fake performance metrics.

Preferred architecture:

```text
Browser
  ↓
Veridex backend
  ↓
Telegraph Engine / Miner API
  ↓
real Miner
  ↓
response
  ↓
Veridex fusion
```

Never expose an x402 private key in frontend code. Use a server-side/burner wallet with limited funds when payment is required.

The UI should visibly show that Telegraph was actually used, including intent/request status and payment/transaction proof where available and appropriate.

## 7. Multi-intent strategy

Telegraph rules emphasize multi-intent/cross-domain intelligence. Implement this only with intents currently available in the live supported-intents catalog.

Target architecture:

```text
Contract
 ├── security/risk signal
 ├── research/context signal
 ├── fraud/maliciousness signal where currently supported
 └── other relevant supported intent
          ↓
     signal comparison
          ↓
     evidence fusion
```

Do not force multi-intent into MVP if the current catalog or API does not support a reliable combination.

## 8. UI / information architecture

### Home

- Veridex value proposition
- contract input
- Analyze action
- concise explanation of Telegraph role

### Analysis

Show the decision first:

```text
Risk state
Confidence/state
Why
```

Then show:

1. deterministic evidence
2. Telegraph intelligence
3. conflicts
4. provenance
5. advanced details

### Telegraph Intelligence panel

Must make the network contribution obvious:

- intent
- live request status
- Miner/provider information when available
- response/signal
- confidence if provided
- x402/payment proof where available

### Evidence Explorer

Expose the chain from observation → evidence → interpretation → final result.

### Actions

- Start Watch
- inspect evidence
- export/share report if already supported
- optional agent workflow

## 9. Agent layer — optional after MVP

Do not build a generic chatbot.

If agent mode is added, expose bounded tools such as:

```text
analyze_contract()
get_evidence()
query_telegraph()
compare_signals()
watch_contract()
```

Agent actions must call the same real application services as the UI.

## 10. Watch / persistent intelligence — stretch goal

Use the existing Watch foundations after the core Track 3 flow is stable:

```text
watched contract
      ↓
new on-chain state / new intelligence
      ↓
re-analysis
      ↓
risk changed?
      ↓
alert
```

Never claim durable scheduling or alerts unless actually deployed and verified.

## 11. Usage instrumentation

Track real activity only:

- analyses
- unique contracts
- Telegraph inference calls
- successful/failed requests
- intent usage
- inference spend
- watch usage if deployed

No fabricated users, traffic, demand, ranking or performance.

The Track 3 goal is real application demand, so genuine external usage is more valuable than synthetic benchmark volume.

## 12. MVP definition

Track 3 MVP is complete only when all are true:

- [ ] existing Veridex web app remains the product surface
- [ ] contract input works in production
- [ ] existing deterministic analysis works
- [ ] at least one currently supported Telegraph intent works live
- [ ] a real Telegraph Miner response is received
- [ ] x402/payment flow works where required
- [ ] Telegraph response is normalized into application signals
- [ ] final result preserves evidence/provenance
- [ ] confidence/state is explicit
- [ ] Telegraph contribution is visible in UI
- [ ] no mock production data
- [ ] no fabricated usage metrics
- [ ] production deployment is live
- [ ] mobile and desktop flows work
- [ ] submission evidence can reproduce the live flow

## 13. Stretch goals

Only after MVP is stable:

1. multi-intent orchestration
2. cross-signal contradiction detection
3. richer evidence fusion
4. agent mode / MCP integration
5. Watch re-analysis and alerts
6. historical risk timeline
7. downloadable reports
8. public API for other agents

## 14. Five-day execution plan

### Sep 2 — Foundation

- audit current Track 3 code
- verify live supported intents
- verify current Telegraph API/schema
- implement/repair secure Telegraph client
- prove one real Miner request end-to-end
- record request/payment/result evidence

**Gate:** one real contract → real Telegraph request → real response visible in Veridex.

### Sep 3 — Intelligence fusion

- normalize Telegraph signal
- combine with deterministic evidence
- implement confidence/state model
- implement contradiction handling
- preserve provenance

### Sep 4 — Product UX

- polish Analyze → Decision → Why → Telegraph → Evidence flow
- mobile/desktop QA
- remove nonessential UI noise
- make Telegraph contribution immediately visible

### Sep 5 — Advanced capability

Only if MVP is stable:

- second relevant intent
- signal comparison
- agent workflow
- Watch prototype

### Sep 6 — Real users

- keep Miner live
- acquire genuine testers
- collect real contracts and real requests
- fix usability failures
- capture real usage evidence
- publish transparent X updates

### Sep 7 — Submission lock

- freeze architecture
- production QA
- verify GitHub README/docs
- verify live URL
- prepare demo video
- prepare architecture/evidence screenshots
- prepare real Telegraph request/payment evidence
- submit

## 15. Demo narrative

60-second demo structure:

1. **Problem:** a contract address does not directly provide a trustworthy risk decision.
2. **Input:** paste a real contract.
3. **Veridex:** deterministic capability/evidence analysis runs.
4. **Telegraph:** live intelligence is requested from the network.
5. **Fusion:** signals and evidence are compared, including conflicts.
6. **Decision:** confidence-aware risk result is produced.
7. **Proof:** show Telegraph request/payment and evidence trail.
8. **Close:** Veridex turns distributed Telegraph intelligence into an auditable on-chain decision.

## 16. Judge test

A judge should understand within 30 seconds:

**What?** On-chain risk intelligence.  
**Why Telegraph?** Live distributed intelligence from the Telegraph network.  
**What does Veridex add?** Deterministic contract evidence, provenance, signal fusion and confidence-aware decisions.  
**What is real?** Live Miner requests, real payment/request evidence and a real user workflow.  
**Why different?** It does not merely wrap an API; it turns Telegraph intelligence into an actionable, auditable decision.

## 17. Hard prohibitions

Do not:

- create a second unrelated Track 3 website
- make Track 3 depend on the Track 2 WASM scorer
- submit another Track 2 scorer variant merely to chase hidden 0.0855 behavior
- fake Miner responses
- fake users/traffic/demand
- expose private payment keys in frontend code
- claim official rankings without evidence
- claim confidence that cannot be explained
- turn provider failure into a negative security finding
- add complexity that does not improve the live user workflow

## 18. Decision log

### Decision A — Existing Veridex website

Track 3 will be implemented in the existing Veridex product. Do not create a separate application unless a concrete technical constraint proves the existing deployment cannot support the required flow.

### Decision B — Track 2 remains independent

The Track 2 CLI/WASM scorer is not a Track 3 frontend dependency. Freeze it while the repeated external evaluation result is investigated.

### Decision C — Telegraph must be real

Track 3 production/demo evidence must come from live Telegraph Miner requests. No simulated intelligence.

### Decision D — Deterministic + network intelligence

Veridex's strongest differentiator is the combination of deterministic on-chain evidence and Telegraph-routed intelligence. Preserve that separation and make the interaction explicit.

### Decision E — Evidence over certainty

The product must expose provenance, conflicts, unavailable states and confidence rather than pretending every network response is ground truth.

## 19. Next agent instruction

If this repository is opened in a new chat/agent, **read this file first**, then read:

1. `PROJECT_STATE.md`
2. `AGENTS.md`
3. `docs/ARCHITECTURE.md`
4. `docs/TRACK-3-APPLICATION.md`
5. `docs/TELEGRAPH_REFERENCE.md`
6. current Telegraph official integration/supported-intents/rules references

Then perform a **read-only audit** of the existing Track 3 implementation and report:

```text
FACTS
ALREADY IMPLEMENTED
PARTIAL
MISSING
BLOCKERS
NEXT ACTION
```

Do not start coding until the audit identifies the smallest safe implementation gap.
