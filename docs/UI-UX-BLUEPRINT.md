# Veridex UI / UX / Motion Blueprint

## Product Experience Goal

Veridex should feel like an **instrument panel for verifiable on-chain intelligence**, not a generic crypto dashboard or a block-explorer clone.

The user should always understand:

1. what Veridex is checking
2. what address is being inspected
3. whether a proxy exists
4. where the implementation lives
5. what evidence supports each finding
6. what is verified vs inferred vs unavailable
7. how confident the system is
8. what an agent can consume programmatically

## Visual Language

Direction:

- dark technical canvas with high legibility
- restrained accent system
- crisp typography
- thin evidence lines
- node/graph motifs
- subtle depth, not excessive glassmorphism
- no meme-coin aesthetics
- no fake terminal clutter

## Information Architecture

### Landing

Hero:

**Verifiable On-Chain Intelligence**

Subtext:

Analyze contract ownership, proxy architecture, capabilities, and evidence provenance — deterministically.

Primary CTA: **Analyze a contract**

Secondary CTA: **View Miner**

Trust strip:

`Deterministic · Evidence-first · Proxy-aware · Telegraph Miner`

### Analyzer

Input:

- contract address
- network selector
- optional advanced settings

After submission, transition into the live analysis view.

### Live Analysis

Main canvas:

```text
[CONTRACT]
    │
    ├── proxy?
    │      │
    │      └── implementation
    │
    ├── ownership
    ├── pause capability
    ├── mint capability
    │
    └── evidence
```

A real event should illuminate each node as backend evidence arrives.

### Result Dashboard

Top summary:

- contract identity
- network
- proxy status
- implementation
- overall analysis state

Then cards:

- Ownership
- Upgradeability
- Pause
- Mint
- Evidence quality
- External dependency state

Each card exposes:

`finding → evidence → detection method → confidence → source`

### Evidence Explorer

A dedicated forensic view:

- ABI evidence
- source verification
- bytecode evidence
- RPC state
- external API evidence
- timestamps
- queried address
- code address

### Proxy Graph

Interactive graph:

`caller → proxy → beacon/admin → implementation`

Only show edges that are actually established by evidence.

### Developer View

Tabs:

- Human summary
- JSON
- Evidence
- Request/response
- Miner metadata

The JSON output should be copyable and suitable for agent consumption.

## Motion System

### State machine

```text
IDLE
 ↓
VALIDATING
 ↓
RESOLVING_CHAIN
 ↓
DETECTING_PROXY
 ↓
RESOLVING_IMPLEMENTATION
 ↓
VERIFYING_ABI
 ↓
RUNNING_CHECKS
 ↓
RECONCILING_EVIDENCE
 ↓
READY
```

Error states branch explicitly:

`DEGRADED`, `UNAVAILABLE`, `UNSUPPORTED`, `FAILED`

### Animation rules

- Never fake progress.
- Never show a successful state before the backend reports it.
- Animate evidence arrival, not arbitrary percentages.
- Use latency markers for network operations.
- Use a different visual treatment for “not applicable” vs “failed”.
- Use confidence as a measured attribute, not a decorative score.

## Accessibility

- keyboard-first analyzer flow
- reduced-motion mode
- WCAG-conscious contrast
- semantic headings
- visible focus
- no information conveyed only by color
- screen-reader-readable evidence labels

## Mobile

The analysis timeline becomes a vertical evidence stream.

The proxy graph becomes a horizontally scrollable/stacked relationship view.

Raw JSON remains accessible but secondary.

## Performance UX

Do not delay visible useful information until every check completes.

Stream verified intermediate results where the protocol allows it:

`proxy found → implementation found → ABI verified → check complete → final synthesis`

The final result must still be atomic and machine-readable.

## Brand Motion

Veridex motion motif: **evidence propagates through a graph**.

A finding should visually travel from:

`chain → evidence source → analysis node → result`

This becomes the signature animation across landing, analyzer, demo, and presentation.

## Judge Demo Mode

Create a controlled demo route that can show:

1. real contract input
2. live proxy resolution
3. evidence acquisition
4. capability detection
5. final machine-readable result
6. Telegraph Miner endpoint
7. latency and reliability evidence

Demo mode must not fake production results. If fixture data is shown, label it explicitly.
