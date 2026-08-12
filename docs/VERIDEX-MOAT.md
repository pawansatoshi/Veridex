# Veridex Moat — Capability Passport & Change Intelligence

## Decision

Veridex will not compete as another one-shot contract scanner.

Its differentiating product layer is the **Veridex Capability Passport**: a provenance-backed snapshot of what a contract is demonstrably capable of doing, which addresses control its code/state, how each conclusion was established, and what would constitute a meaningful change.

A later observation becomes a **change event** when the verified capability surface or control topology changes.

Positioning:

> **Don't just analyze a contract. Know when its powers change.**

This is a product direction, not a claim that every change can currently be detected. Detection coverage must be explicitly versioned and evidence-backed.

## Why this is strategically different

A conventional scanner answers:

> What does this contract look like right now?

Veridex should answer two questions:

1. **What can this contract demonstrably do right now?**
2. **Has the evidence-backed capability surface changed since the last trusted observation?**

This turns a one-shot analysis into persistent intelligence.

Telegraph's hackathon positioning emphasizes verifiable signals and persistent intelligence. The feature therefore aligns with the protocol thesis while remaining useful independently of Telegraph.

## Capability Passport

A passport is a versioned, machine-readable snapshot containing:

- requested address
- chain/network
- code address
- implementation address when actually resolved
- proxy type and provenance
- ownership/admin observations
- pause capability and live state where supported
- mint capability and authority evidence where supported
- evidence sources and detection methods
- fallback/degradation state
- confidence/quality metadata
- analysis timestamp and freshness metadata
- analysis schema version

The passport is **not** a security certificate and must never imply that absence of a detected capability means the contract is safe.

## Change Intelligence

When two passports are comparable, Veridex can classify observed differences such as:

### Control-plane change

Examples:

- implementation address changed
- proxy topology changed
- ownership/admin authority changed
- upgrade authority changed when that module exists

### Capability change

Examples:

- mint capability newly detected
- pause capability newly detected
- a previously detected capability no longer has the same evidence

### Evidence-quality change

Examples:

- verified ABI became unavailable
- external verification API failed
- analysis degraded from ABI evidence to bytecode fallback

Evidence-quality changes must not be represented as contract capability changes.

## The critical safety rule

**Do not infer a change from incomplete observations.**

If the new observation is degraded because a provider, verification service, or RPC failed, Veridex must say:

> `comparison: inconclusive`

rather than:

> `capability removed`

This distinction is a core part of the moat.

## User experience

The UI should eventually expose:

```text
CONTRACT PASSPORT

Implementation       0xABC...
Ownership            Controlled
Pause                Enabled
Mint                 Detected
Evidence quality     High

        ↓

CAPABILITY TIMELINE

Today        Mint detected
7d ago       Mint detected
30d ago      Mint absent / inconclusive

        ↓

CHANGE EVENT

⚠ IMPLEMENTATION CHANGED

Previous  0x123...
Current   0xABC...

Why it matters
The code executing behind the proxy changed.

Evidence
Proxy storage observation + implementation resolution
```

The interface must distinguish **changed**, **unchanged**, and **inconclusive** states.

## Agent use case

An autonomous treasury or DeFi agent can ask:

> "Has this contract's control or capability surface changed since my last trusted observation?"

The answer should be machine-readable and evidence-backed:

```json
{
  "status": "changed",
  "changes": [
    {
      "type": "implementation_changed",
      "previous": "0x...",
      "current": "0x...",
      "evidence": ["proxy_storage"]
    }
  ],
  "comparison": "conclusive"
}
```

The exact production schema will be designed only after the base analysis result and freshness semantics are stable.

## Implementation strategy

Do not build the entire persistent system immediately.

### Stage A — Passport foundation

- normalize current analysis into a stable versioned snapshot
- make evidence provenance serializable
- define freshness semantics
- deterministic snapshot hashing where useful

### Stage B — Safe comparison

- compare two compatible snapshots
- classify capability/control/evidence changes
- require sufficient evidence for a conclusive comparison
- add adversarial tests for degraded observations

### Stage C — Historical intelligence

- persist snapshots where product infrastructure warrants it
- expose a timeline
- support agent queries
- measure storage and latency costs

### Stage D — Telegraph signal

If the official Telegraph Intent/evaluation contract supports it, expose change intelligence as a reusable signal rather than coupling the feature to the web UI.

## Future extensions

Potentially useful later capabilities:

- implementation bytecode fingerprinting
- verified ABI version changes
- ownership/admin changes
- upgrade-authority changes
- timelock/multisig topology changes
- capability additions/removals
- historical evidence replay
- agent preflight policies

Each extension requires its own evidence model and benchmark.

## Non-goals

- no claim of formal contract safety
- no universal vulnerability detection
- no silent inference from missing data
- no fake historical data
- no automatic alerting until comparison semantics are proven
- no scoring formula added solely to make the feature look impressive

## Success criterion

The feature succeeds when a user or agent can reliably distinguish:

1. **the contract changed**
2. **the evidence changed**
3. **the infrastructure failed**
4. **nothing materially changed**

without Veridex confusing those states.
