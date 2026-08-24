# Phase 05 — UX / Information Architecture Overhaul

## Purpose

Reduce cognitive load without reducing product depth. Veridex should feel like a calm, premium instrument rather than a single-page product brochure containing every current and future subsystem.

## User journey

`understand → analyze → trust → explore depth`

The landing page owns the first three steps. Technical depth belongs behind progressive disclosure and dedicated product surfaces.

## Phase 05A — Landing page clarity

**Status: IMPLEMENTED on `ux-overhaul-phase-1`.**

Goals:

- one dominant hero thesis
- one primary action
- concise proof model
- focused capability layer
- remove future Passport / Watch / Telegraph marketing blocks from the landing page
- remove the eight-language block from the page body
- remove unsupported multi-chain implication from the primary analyzer copy
- preserve the existing `/analyze` backend contract
- improve mobile information hierarchy rather than merely stacking desktop sections
- expose raw JSON only after the human-readable result

Implemented structure:

1. Navigation
2. Hero + analyzer
3. Evidence-before-interpretation proof
4. Four capability questions
5. Capability ≠ Function concept
6. On-page analysis result
7. Minimal footer

## Phase 05B — Dedicated product surfaces

Planned:

- `/analyze` — full analyzer and live evidence journey
- `/passport` — capability passport
- `/watch` — continuous monitoring and change timeline
- `/telegraph` — Miner, Intent, evaluation and machine-readable delivery
- `/docs` — technical evidence model and API documentation

Do not build these until Phase 05A has been verified on mobile and desktop.

## Phase 05C — Progressive disclosure

Planned:

- plain-language first result
- evidence explanation per capability
- technical evidence drawer
- proxy graph only when supported by actual evidence
- raw JSON as deepest layer
- no arbitrary progress percentages
- real analysis state transitions only

## Phase 05D — Motion and spatial intelligence

Planned:

- evidence-flow animation tied to actual analysis events
- reduced-motion path
- lightweight SVG/2.5D representation for mobile
- no animation that implies evidence before evidence exists

## Phase 05E — Accessibility and release QA

Required checks:

- mobile widths including 320px and 360px
- no horizontal overflow
- touch targets remain usable
- keyboard navigation
- visible focus
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
