# Phase 05 — UX / Information Architecture Overhaul

## Purpose

Reduce cognitive load without reducing product depth. Veridex should feel like a calm, premium instrument rather than a single-page product brochure containing every current and future subsystem.

## User journey

`understand → analyze → trust → inspect evidence → explore depth`

The landing page owns the first three steps. Technical depth belongs behind progressive disclosure and dedicated product surfaces.

## Phase 05A — Landing page clarity

**Status: COMPLETE.**

## Phase 05B — Dedicated product surfaces

**Status: COMPLETE / shipped to `main`.**

- `/analyze/` — full analyzer
- `/passport/` — Capability Passport
- `/watch/` — browser-local watch workspace
- `/evidence/` — progressive evidence inspection
- `/telegraph/` — Miner/Intent operational surface
- `/docs/` — product and evidence documentation

All surfaces consume the existing `/api/analyze` contract rather than duplicating the deterministic engine.

## Phase 05C — Progressive disclosure

**Status: COMPLETE.**

Evidence-specific explanations, expandable evidence, proxy composition, provider/verification diagnostics and uncertainty boundaries are exposed progressively. Missing evidence is not fabricated and provider failure is not converted into a negative capability finding.

## Phase 05D — Motion and spatial intelligence

**Status: COMPLETE / shipped.**

Implemented the six-stage evidence-flow visualization, proxy/state/code relationship view, responsive mobile representation and reduced-motion behavior. Motion follows returned analysis state and cannot create evidence.

## Phase 05E — Accessibility and release QA

**Status: COMPLETE / release hardening shipped.**

Implemented:

- shared release accessibility CSS layer
- visible `:focus-visible` treatment
- 44px minimum interaction targets for shared controls
- narrow-screen overflow/wrapping safeguards at 360px and below
- explicit reduced-motion safeguards
- accessible analyzer/evidence error semantics
- expandable evidence controls with `aria-expanded` / `aria-controls`
- spatial layer focus and touch-target hardening
- deterministic static release-QA audit: `npm run verify:release-qa`

### Release-QA contract

The static audit covers all seven HTML release surfaces for viewport metadata, horizontal-overflow protection and reduced-motion support, plus analyzer/evidence-specific accessibility contracts.

The audit is a **release gate**, not a substitute for real-device testing. Final browser QA must still be reproduced at 320/360px widths with keyboard and screen-reader checks before making a runtime accessibility claim.

### Accessibility integrity rules

1. No status may rely on color alone.
2. Keyboard focus must remain visible.
3. Interactive controls must remain usable at narrow widths.
4. Reduced motion must preserve information, not remove state.
5. Loading/error/inconclusive states must remain distinguishable.
6. Raw JSON remains secondary to the human-readable result.
7. Spatial visualization is understandable without animation.

## Phase 05 exit condition

**UX implementation: COMPLETE.**

The next engineering priority is no longer another UX feature. It is fresh current-main verification: blocking CI, real-chain ground truth, resilience, production benchmark/schema and live Telegraph registry alignment.

## Product rule

The landing page should answer three questions within seconds:

1. What is Veridex?
2. Why should I trust the answer?
3. What can I do now?

Everything else is progressive disclosure.
