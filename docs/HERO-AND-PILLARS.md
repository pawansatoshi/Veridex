# Veridex Hero & Product Pillars

## Design decision

The Veridex website must feel premium and calm, not noisy. The first screen should communicate one idea in seconds, then progressively reveal depth.

## Hero

### Primary headline

**Know what a contract can do.**

### Supporting line

**Veridex turns on-chain evidence into clear, verifiable intelligence — for people and autonomous agents.**

### Primary action

**Analyze a contract**

### Secondary action

**See how it works**

### Trust line

`Evidence-first · Proxy-aware · Deterministic · Telegraph Miner`

### Hero visual

A single large spatial **Contract Core** is the visual anchor. It is not a rotating crypto coin and not a dashboard collage.

The core has three restrained layers:

1. **Contract** — the address the user supplied.
2. **Execution** — proxy / implementation relationship when proven.
3. **Evidence** — small orbiting evidence nodes representing only real sources.

A subtle signal travels from chain → evidence → analysis → result. This is Veridex's signature motion language.

No floating cards everywhere, no particle storm, no excessive gradients, no fake terminal text.

## Product pillars

Veridex is explained through five user-facing pillars. They are simple enough for a beginner and precise enough for a developer.

### 1. Understand

**What is this contract?**

Identity, network, proxy status, implementation and basic contract context.

### 2. Verify

**Why should I believe the result?**

Verified ABI/source when available, bytecode evidence, RPC state, queried address, code address, timestamps and detection method.

### 3. Discover Powers

**What can this contract actually do?**

Ownership, upgradeability, pause, mint and future high-value capabilities. Findings are evidence-backed rather than guessed.

### 4. Watch

**What changes after I leave?**

Capability Passport, persistent monitoring, change detection, alerts and a capability timeline. Infrastructure failure never becomes a false change alert.

### 5. Connect

**Can software use the same intelligence?**

Machine-readable results, agent/API access and the Telegraph Miner layer. Humans get understandable explanations; agents get structured evidence.

## Secondary architecture explanation

After the hero, show one quiet sentence:

**One contract. Five questions. One evidence trail.**

Then visually reveal:

`Understand → Verify → Discover Powers → Watch → Connect`

Each pillar opens into a short plain-language explanation and an optional technical detail layer.

## Audience translation

### Beginner

Use plain questions:

- Who controls it?
- Can its code change?
- Can it create more tokens?
- Can someone pause it?
- Did anything important change?

### Developer

Expose implementation addresses, ABI signatures, storage/code context, detection method and provenance.

### Agent

Expose stable structured output, evidence, confidence and conclusive/inconclusive state.

## Visual hierarchy

The page should follow this rhythm:

1. **Hero** — one idea, one action, one visual.
2. **Five pillars** — explain the product without jargon.
3. **Live analysis story** — show evidence moving through the system.
4. **Capability Passport + Watch** — demonstrate the unique persistent value.
5. **Evidence Explorer** — reveal technical depth.
6. **Telegraph / agent layer** — explain distribution and machine use.
7. **Judge-grade proof** — latency, deterministic behavior, provenance and live demo.
8. **Final CTA** — Analyze a contract / Run with Veridex.

## Motion rules

- The hero has one dominant motion system.
- 3D depth is used for spatial understanding, not decoration.
- Every animation must have a semantic reason.
- Reduce-motion mode removes depth movement while preserving state transitions.
- Mobile uses a lightweight 2.5D/SVG representation when full 3D is inappropriate.
- Never animate a finding before the backend has established it.

## Brand principles

**Calm authority.**

Veridex should feel like a trusted instrument, not a casino dashboard.

Words to favor:

`verified · evidence · observed · changed · inconclusive · confidence · capability`

Words to avoid in core UX:

`guaranteed · safe · scam · 100% secure · magic · AI-powered` unless the statement is technically justified.

## Product promise

Primary:

> **Know what a contract can do.**

Differentiator:

> **And know when its powers change.**

Technical descriptor:

> **Verifiable On-Chain Intelligence**

The hero should remain understandable without knowing Telegraph, Solidity, EVM, or crypto terminology. Telegraph appears as infrastructure/trust context, not as the first thing a new user has to understand.
