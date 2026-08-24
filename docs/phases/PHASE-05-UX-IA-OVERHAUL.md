# Phase 05 — UX / Information Architecture Overhaul

## Purpose

Reduce cognitive load without reducing product depth. Veridex should feel like a calm, premium instrument rather than a single-page product brochure containing every current and future subsystem.

## User journey

`understand → analyze → trust → inspect evidence → explore depth`

The landing page owns the first three steps. Technical depth belongs behind progressive disclosure and dedicated product surfaces.

## Phase 05A — Landing page clarity

**Status: COMPLETE.**

Implemented:

- one dominant hero thesis
- one primary action
- concise proof model
- focused capability layer
- future Passport / Watch / Telegraph marketing blocks removed from the landing page
- large language block removed
- unsupported multi-chain implication removed from primary analyzer copy
- existing `/api/analyze` backend contract preserved
- mobile hierarchy redesigned rather than simply stacked
- raw JSON exposed only after the human-readable result

## Phase 05B — Dedicated product surfaces

**Status: COMPLETE / implementation shipped to `main`.**

Implemented dedicated surfaces:

- `/analyze/` — full analyzer and live evidence journey
- `/passport/` — Capability Passport observation surface
- `/watch/` — browser-local watch workspace with manual re-checks
- `/telegraph/` — Miner, Intent, schema and operational boundary surface
- `/docs/` — product, evidence, proxy, Passport, Watch and API documentation

### Architectural constraint

The surfaces do not duplicate the deterministic analysis engine. They call the existing `/api/analyze` contract and consume its normalized result, Capability Intelligence and Capability Passport representations.

### Watch boundary

The current `/watch/` surface intentionally uses browser-local storage and manual checks. It does **not** claim deployed background polling, durable server-side persistence or alert delivery. The existing Phase 04 domain model remains the foundation for a future production WatchStore/scheduler.

### Telegraph boundary

The `/telegraph/` page presents the repository's recorded Miner configuration and historical verification policy without turning historical measurements into current runtime claims.

## Phase 05C — Progressive disclosure

**Status: COMPLETE.**

Implemented dedicated `/evidence/` Evidence Explorer:

- capability-specific “Why?” explanations
- expandable evidence drawers for Ownership, Upgradeability, Pause and Mint
- structured evidence key/value inspection
- detection method, confidence, conclusive state and fallback reason
- proxy composition view separating requested/state address from effective code address
- explicit composition status; no inferred proxy claim is created by the UI
- provider and verification diagnostics including RPC state, verification state/source, ABI availability and overall conclusiveness
- deep navigation back to Analyze, Passport and Watch for the same contract
- responsive mobile layout and reduced-motion behavior

### Evidence integrity rules

1. The UI only renders evidence returned by `/api/analyze`.
2. A missing field is shown as unavailable rather than fabricated.
3. A provider failure remains distinct from a negative capability finding.
4. Proxy state and implementation/code address remain separate.
5. Confidence and conclusiveness are displayed as observation metadata, not as a security score.
6. No historical change is implied by a single observation.

## Phase 05D — Motion and spatial intelligence

**Status: NEXT.**

Planned:

- evidence-flow animation tied to actual analysis events
- reduced-motion path
- lightweight SVG/2.5D representation for mobile
- capability-change visual delta

Motion must communicate actual state transitions and must never imply evidence before the analyzer has returned it.

## Phase 05E — Accessibility and release QA

**Status: NEXT.**

Required checks:

- 320px and 360px mobile widths
- no horizontal overflow
- touch targets remain usable
- keyboard navigation and visible focus
- semantic heading order
- reduced motion
- no color-only meaning
- analyzer success/error/inconclusive states
- raw JSON remains accessible without dominating the default result

## Product rule

The landing page should answer three questions within seconds:

1. What is Veridex?
2. Why should I trust the answer?
3. What can I do now?

Everything else is progressive disclosure.
