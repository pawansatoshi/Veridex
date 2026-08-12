# Veridex Capability Monitor

## Product concept

A user can add a contract once and create a persistent **Capability Watch**. Veridex periodically re-evaluates the contract and maintains a versioned Capability Passport over time.

The product must make the contract's changing control surface observable without requiring the user to press Analyze again.

## Core experience

```text
ADD CONTRACT
    ↓
INITIAL PASSPORT
    ↓
WATCH ACTIVE ●
    ↓
continuous observations
    ↓
change detection
    ↓
alert only on meaningful, evidenced changes
    ↓
new passport version
```

## What is monitored

- proxy / implementation identity
- proxy type and beacon resolution state
- ownership/admin authority
- pause capability and relevant live state
- mint capability and authority
- verified ABI/source status
- bytecode fingerprint where appropriate
- evidence quality and fallback state
- supported contract metadata

## Change classes

### Critical

Changes that can materially alter control of a contract, such as an implementation change or newly evidenced mint/upgrade authority.

### Warning

Meaningful capability/evidence changes that deserve review but are not automatically classified as critical.

### Informational

Non-security changes such as metadata or verification-state changes.

### Inconclusive

The previous and current states cannot be safely compared because evidence is unavailable or infrastructure failed. **Never convert this into a risk finding.**

## Live ranking and score

Veridex may maintain a continuously updated **intelligence/risk profile** for a watched contract, but scoring is deliberately separated from raw evidence. No proprietary numeric score is implemented until the official Telegraph Intent/evaluation contract and ground truth are verified.

When scoring is introduced, every score must be:

- derived from stored evidence
- versioned
- reproducible
- timestamped
- explainable
- distinguishable from Telegraph's external canonical Miner score

The UI must never imply that a Veridex score is an official Telegraph ranking unless it actually is.

## Alerts

Supported future channels can include:

- in-app notification center
- browser push
- email
- Telegram/webhook integrations where appropriate
- agent/MCP event consumption

Alert payloads should include:

```text
what changed
previous state
current state
evidence
confidence
observed at
comparison status
```

## Cost and resource model

"Always live" means **persistent monitoring as a service**, not an unbounded free polling loop.

The architecture must support:

- adaptive polling intervals
- event/log driven triggers where reliable
- deduplicated observations
- provider-aware batching
- caching of immutable evidence
- bounded concurrency
- per-watch resource budgets
- pause/resume controls
- clear retention policy

No monitoring design should consume unlimited RPC/API resources merely because a user clicked Watch.

## Future differentiator: Capability Time Machine

Each meaningful observation becomes a versioned passport. Users can move through time:

```text
v1 ── v2 ── v3 ── v4 ── CURRENT
      ↑             ↑
   pause added   implementation changed
```

The UI can replay the exact evidence transition that caused a change alert.

This turns Veridex from a one-shot scanner into a **persistent capability intelligence layer** for humans and autonomous agents.

## Safety rule

A failed observation is not a changed contract.

A missing verification response is not proof that a capability disappeared.

A provider outage is not evidence about the contract.

Every comparison must carry a conclusive/inconclusive state and provenance.
