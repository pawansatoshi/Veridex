# Veridex UX Redesign Blueprint

Status: **Implemented and production-verified UX refinement after Track 3 submission.**

## Objective

Make Veridex feel like one premium evidence-intelligence product rather than a collection of technically related dashboards. Preserve existing application behavior, API contracts, evidence semantics, Telegraph integration, and navigation destinations. Presentation improvements may add progressive disclosure or responsive navigation where they do not alter the underlying request/response flow.

## North-star experience

**From contract address to evidence-backed decision.**

Primary journey:

`Analyze → Decision → Evidence → Passport / Watch`

Telegraph is the external intelligence layer inside that journey, not a separate visual universe.

## Design principles

1. **Hierarchy over decoration.** One dominant answer per screen; metadata is subordinate.
2. **Fewer boxes.** Use spacing and dividers before adding another bordered panel.
3. **Readable technical UI.** Normal body text is comfortable on phones; monospace is reserved for addresses, hashes, fingerprints, selectors, JSON, and raw evidence.
4. **Semantic color.** Mint = established/confirmed; violet = Telegraph intelligence; amber = uncertainty/conflict; red = actual adverse state; gray = unavailable/not established.
5. **Purpose-specific density.** Analyze is the product surface; Evidence is forensic; Passport is an artifact; Watch is longitudinal; Telegraph is integration context; Docs are technical reference.
6. **No AI ornamentation.** No gratuitous neon, sci-fi graphics, decorative crypto imagery, or visual noise.
7. **Progressive disclosure.** Primary decision first; deeper evidence and raw provider payload later.
8. **Mobile-first navigation.** Desktop may expose the full shell; mobile uses a readable menu rather than a row of tiny links.
9. **Guided states.** Long-running analysis gets explicit progress language so waiting feels purposeful.
10. **Preserve trust boundaries.** Provider failure is visibly distinct from negative capability evidence.

## Global design system

### Typography

Preferred stack:
- Sans: Geist where available, then Inter, then system UI.
- Mono: Geist Mono where available, then ui-monospace.

Type scale:
- Display: 56–68px desktop, 40–48px phone.
- Section heading: 30–42px.
- Card heading: 15–18px.
- Body: 15–16px.
- Supporting body: 13–14px.
- UI/meta: 11–12px.
- Micro-label: 9–10px only.

### Color semantics

- Background: `#05070A`
- Surface: `#0B1016`
- Elevated surface: `#101722`
- Primary text: `#F4F7FA`
- Secondary text: `#AAB5C1`
- Tertiary text: `#7E8B9A`
- Veridex mint: `#7FE0BC`
- Telegraph violet: `#A98BFF`
- Uncertainty amber: `#EAC46B`
- Danger: `#F2788C`

### Shape and spacing

- Control radius: 10–12px.
- Card radius: 14–16px.
- Major surface radius: 20–24px.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.
- Borders stay subtle and sparse.

## Implemented roadmap

### Phase 1 — Shared visual language ✅

Global visual tokens, typography, readability, focus states, spacing, controls, and semantic colors were refined without changing application semantics.

### Phase 2 — Home ✅

The hero and analyzer remain the visual focal point. Supporting sections now use stronger typographic hierarchy and less microcopy density.

### Phase 3 — Analyze ✅

The assessment is decision-led. Capability findings and evidence follow the headline result; raw JSON remains secondary. Guided progress now explains the active analysis stage.

### Phase 4 — Telegraph Application ✅

The workflow is visually restrained and the assessment is dominant. Telegraph is explicitly presented as independent intelligence. Raw provider response is available through progressive disclosure instead of occupying the default viewport.

### Phase 5 — Passport ✅

Passport is presented as an evidence artifact: identity, posture, capabilities, fingerprint, composition, and verification are separated by hierarchy rather than competing equally.

### Phase 6 — Evidence ✅

Evidence Explorer follows a forensic reading model and retains proxy, verification, and provider diagnostics as separate concepts.

### Phase 7 — Watch ✅

Watch keeps its honest browser-local scope and presents saved contracts as a longitudinal workspace without implying background monitoring or alerts.

### Phase 8 — Telegraph hub/protocol pages ✅

Application, Miner, and Evaluation remain audience-specific while sharing one product shell. Application is the recommended judge/user path.

### Phase 9 — Final polish ✅

Mobile navigation was upgraded to a readable menu, action targets were enlarged, guided progress was added for analysis flows, and large raw provider payloads were moved behind disclosure.

## Acceptance criteria

- No normal body copy intentionally uses tiny 7–10px sizing.
- Micro-labels remain the only intentionally small text.
- One clear primary CTA per page state.
- Primary decision is visually dominant over metadata.
- Telegraph violet is reserved for external-intelligence semantics.
- Mint is reserved for established/confirmed states and primary actions.
- Technical payloads are progressively disclosed.
- Mobile navigation does not force a tiny horizontal link row.
- Existing API request/response behavior remains unchanged.
- Existing application URLs remain unchanged.
- Focus indicators and interactive controls remain visible and comfortably targetable.
- Design remains readable when browser text/viewport size is increased.

## External design/accessibility baseline

The refinement uses WCAG 2.2 as the accessibility baseline, particularly its guidance for target size, focus visibility, readable/reflowing content, and understandable/predictable interfaces. W3C notes that WCAG 2.2 is the current WCAG recommendation and adds Target Size (Minimum) and Focus Appearance-related criteria. The implementation does not claim formal WCAG conformance without a complete audit.
