# Veridex UI / UX / Product Experience Blueprint

## Product Experience Goal

Veridex should feel like a **calm, premium instrument for understanding on-chain behavior** — not a scary security scanner, crypto terminal, or block-explorer clone.

The design target is **Apple-grade clarity with technical depth underneath**:

- beautiful before complicated
- simple before powerful
- progressive disclosure instead of information overload
- confidence without fear
- visual intelligence without visual noise
- premium 3D depth used purposefully
- every animation tied to real system state

A child, first-time crypto user, developer, researcher, or senior security engineer should all understand the primary journey:

`paste address → understand what it can do → see why → keep watching`

## Core Product Promise

### Human language

**Understand what a contract can do — and know when its powers change.**

### Technical description

Verifiable on-chain intelligence with evidence provenance, proxy-aware analysis, persistent monitoring, and machine-readable outputs.

## Experience Principles

### 1. Five-second comprehension

The landing page must answer immediately:

**What is this?**

> Veridex watches smart contracts and explains what they can actually do.

**Why should I care?**

> If their powers change, Veridex can tell you.

**What do I do?**

> Paste a contract address.

### 2. Progressive disclosure

Default view: plain-language answer.

Next layer: evidence.

Next layer: technical detail.

Deepest layer: raw JSON / provenance / provider diagnostics.

Never force a beginner to understand `delegatecall`, ABI selectors, proxy slots, or RPC semantics before receiving a useful answer.

### 3. Calm security UX

Do not use fear-heavy language such as “DANGER!!!” or “SCAM!!!” without strong evidence.

Use measured states:

- Verified
- Observed
- Watching
- Changed
- Needs attention
- Inconclusive
- Unavailable

A red state must always explain **what changed and why**, with evidence.

## Visual Direction — “Spatial Intelligence”

### Base aesthetic

- warm-neutral/dark or light-neutral foundation
- exceptionally high text legibility
- restrained accent colors
- soft depth and controlled shadows
- precise typography
- generous whitespace
- large rounded surfaces used sparingly
- thin evidence lines
- subtle 3D objects and topology
- no crypto casino styling
- no excessive glassmorphism
- no fake terminal decoration
- no dense neon dashboard by default

### 3D language

Use 3D as a teaching device, not decoration.

The main 3D metaphor is a **Contract Core**:

```text
            ┌───────────────┐
            │   CONTRACT    │
            │     CORE      │
            └───────┬───────┘
                    │
          ┌─────────┼─────────┐
          ▼         ▼         ▼
       OWNER      PAUSE      MINT
          │         │         │
          └─────────┼─────────┘
                    ▼
                 EVIDENCE
```

For proxies, the 3D model becomes a transparent outer shell + implementation core. This visually explains the critical concept:

**the address you interact with can differ from the code being executed.**

For capability changes, old and new cores can be compared spatially.

## Information Architecture

### 1. Landing

Hero headline:

**Know what a contract can do.**

Supporting line:

**Veridex turns on-chain evidence into clear, verifiable intelligence — and keeps watching after you leave.**

Primary CTA:

**Analyze a contract**

Secondary CTA:

**See how it works**

Trust strip:

`Evidence-first · Proxy-aware · Deterministic · Telegraph Miner`

Hero animation:

A minimal 3D contract object slowly rotates. Evidence particles travel from chain → proxy → implementation → checks → passport. The animation becomes active only when the user scrolls/engages.

### 2. Analyzer

Single dominant input:

`Paste contract address`

Network is auto-detected when reliable; manual selection remains available.

Primary action:

**Analyze**

Advanced controls remain collapsed by default.

### 3. First result

Do not immediately show technical cards.

Start with a plain-language summary:

> **This contract is upgradeable and currently has mint capability.**
>
> We verified these observations from the implementation contract and its published ABI.

Then provide compact proof chips:

`Proxy · Verified ABI · Mint · High confidence`

### 4. Live analysis

The experience transitions into a **real-time evidence journey**.

```text
Contract
   ↓
Understanding structure
   ↓
Finding implementation
   ↓
Checking published evidence
   ↓
Checking powers
   ↓
Building passport
```

Each step shows:

- state
- elapsed time
- actual evidence source
- completed/active/unavailable status

No arbitrary “72% complete” progress bars.

### 5. Capability Passport

The core result surface:

```text
VERIDEX PASSPORT

Contract          0x...
Network           Ethereum
Status            Watching ●

What it can do

Ownership         Controlled
Upgradeability    Upgradeable
Pause             Enabled
Mint              Enabled

Evidence          High confidence
Last verified     2 min ago
```

Every capability has a tap target:

`What does this mean?`

`Why do you say this?`

### 6. Veridex Watch

User can click:

**Watch this contract**

After that, the default model becomes persistent monitoring rather than one-shot analysis.

Watch card:

```text
USDC / Ethereum

● Watching

Implementation   unchanged
Ownership        unchanged
Pause            unchanged
Mint             unchanged

Last checked     8 min ago
Next check       automatic

[ View Passport ]
```

Change state:

```text
🔴 CONTROL SURFACE CHANGED

Implementation changed
0xAAA… → 0xBBB…

Why this matters
The executed implementation changed.

[ Review change ]
```

Inconclusive state:

```text
○ CHECK INCONCLUSIVE

Provider unavailable.
No capability-change alert was generated.
```

This distinction is a core trust feature.

### 7. Change Timeline / Time Machine

A chronological view of verified snapshots:

```text
Today
  ↓
Implementation changed
  ↓
Owner changed
  ↓
Mint capability detected
  ↓
Initial passport
```

A two-snapshot comparison shows only evidence-supported differences.

### 8. Evidence Explorer

Evidence appears in layers:

**Simple:** “Why?”

**Technical:** ABI / source / bytecode / RPC

**Forensic:** queried address, code address, timestamps, provider state, external dependency state

**Raw:** canonical machine-readable JSON

### 9. Proxy Graph

Interactive visual relationship:

```text
YOU
 │
 ▼
PROXY
 │
 ├────────► STORAGE / LIVE STATE
 │
 ▼
IMPLEMENTATION
 │
 ├────────► ABI
 ├────────► BYTECODE
 └────────► CAPABILITIES
```

Only render edges established by actual evidence.

### 10. Developer / Agent view

Tabs:

- Human summary
- Passport
- Evidence
- Change history
- JSON
- API
- Miner

JSON must be copyable in one action.

## Accessibility / Simplicity

- large touch targets
- readable type scale
- plain-language labels
- keyboard navigation
- semantic headings
- visible focus
- reduced-motion mode
- no color-only meaning
- screen-reader-friendly evidence states
- mobile-first critical flow
- avoid unexplained jargon

### Beginner mode

Use language such as:

`Owner` → **Who controls it?**

`Upgradeable` → **Can the code be changed?**

`Mint` → **Can new tokens be created?**

`Pause` → **Can transfers or actions be stopped?**

Advanced users can reveal the technical term alongside it.

## Motion System

### Signature motion: “Evidence flows”

Evidence travels through a spatial graph rather than a fake loading spinner.

```text
CHAIN
  ●
  │
  ▼
PROXY
  ●
  │
  ▼
IMPLEMENTATION
  ●
  │
  ├────► ABI
  ├────► CODE
  └────► STATE
          │
          ▼
       PASSPORT
```

### Motion rules

- motion communicates causality
- evidence arrival creates motion
- errors collapse/branch rather than simply turn red
- changed capabilities create a visible delta pulse
- watch status uses a subtle breathing indicator
- alerts are noticeable but not anxiety-inducing
- respect reduced-motion preferences

## 3D Performance Rules

3D must degrade gracefully.

Preferred stack:

- CSS transforms for simple depth
- lightweight SVG/canvas for graph motion
- WebGL/Three.js only where it creates real explanatory value

On low-power/mobile devices:

- replace heavy 3D with a 2.5D/SVG representation
- preserve the exact information architecture
- never sacrifice interaction speed for visual effects

## Product Emotional Journey

The intended emotional sequence is:

**Curiosity → clarity → trust → confidence → control**

Never:

**confusion → fear → jargon → dashboard overload**

## Brand Voice

Veridex speaks like a calm expert:

- precise
- helpful
- direct
- never sensational
- never shilling
- never hides uncertainty

Preferred:

> “The implementation changed. Here is the evidence.”

Avoid:

> “URGENT!!! THIS TOKEN IS RUGGING!!!”

## Judge Demo Experience

The 90-second product story:

1. Paste a real contract.
2. Watch the spatial evidence analysis.
3. See the plain-language answer.
4. Open the capability proof.
5. Add the contract to Watch.
6. Trigger/show a verified change scenario only when real evidence or clearly labeled fixture data exists.
7. Show the alert.
8. Open the before/after evidence comparison.
9. Show the same result as machine-readable intelligence for an agent.
10. Show Telegraph Miner delivery/performance.

The judge should remember one idea:

> **Veridex does not just inspect contracts. It remembers what they can do and tells you when that changes.**

## Future Product Surface

The same design system should support:

- multi-contract watchlists
- protocol watchspaces
- team alerts
- agent subscriptions
- persistent signal feeds
- MCP
- API keys / developer plans
- historical contract intelligence

These are future layers. Do not build them before the single-contract experience is excellent.
