# Veridex UX Redesign Blueprint

Status: Design system and page-hierarchy refresh after Track 3 submission.

## Objective

Make Veridex feel like one premium evidence-intelligence product rather than a collection of technically related dashboards. Preserve all existing behavior, endpoints, evidence semantics, Telegraph integration, and navigation destinations. This blueprint is a UI/UX-only roadmap unless a confirmed presentation bug requires markup adjustment.

## North-star experience

**From contract address to evidence-backed decision.**

The primary product journey is:

`Analyze → Decision → Evidence → Passport / Watch`

Telegraph is the external intelligence layer inside that journey, not a separate visual universe.

## Design principles

1. **Hierarchy over decoration.** One dominant answer per screen; metadata is subordinate.
2. **Fewer boxes.** Use spacing and dividers before adding another bordered panel.
3. **Readable technical UI.** Normal body text should be comfortable on phones; monospace is reserved for addresses, hashes, JSON, and evidence fingerprints.
4. **Semantic color.** Mint = established/primary evidence; violet = Telegraph intelligence; amber = uncertainty/conflict; red = actual adverse signal; gray = unavailable/not established.
5. **Purpose-specific density.** Analyze is a product surface; Evidence is forensic; Passport is an artifact; Watch is longitudinal; Telegraph is protocol/integration context; Docs are technical reference.
6. **No AI ornamentation.** No gratuitous glowing orbs, sci-fi graphics, animated noise, or decorative crypto imagery.
7. **Progressive disclosure.** Primary decision first; deeper evidence and raw JSON later.
8. **Mobile-first readability.** Avoid 7–9px body copy and prevent horizontal navigation from becoming the visual focus.

## Global design system

### Typography

Preferred stack:
- Sans: Geist Sans where available, then Inter, then system UI.
- Mono: Geist Mono where available, then ui-monospace.

Type scale:
- Display: 56–76px desktop, ~42px phone.
- Section heading: 30–42px.
- Card heading: 15–17px.
- Body: 15–17px.
- Supporting body: 13–14px.
- UI/meta: 11–12px.
- Micro-label: 9–10px only.

### Color semantics

- Background: `#05070A`
- Surface: `#0B1016`
- Elevated surface: `#101722`
- Primary text: `#F4F7FA`
- Secondary text: `#A3AFBC`
- Tertiary text: `#728091`
- Veridex mint: `#7FE0BC`
- Telegraph violet: `#A98BFF`
- Uncertainty amber: `#EAC46B`
- Danger: `#F2788C`

### Shape and spacing

- Small control radius: 12px.
- Card radius: 16px.
- Hero/elevated surface radius: 20–24px.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96.
- Borders are subtle and sparse; avoid nested card borders when whitespace can provide separation.

## Page roadmap

### Phase 1 — Shared visual language

Refresh the global CSS variables, type scale, controls, cards, nav treatment, and semantic status styles. Preserve class names so behavior is unchanged.

### Phase 2 — Start/Home

Keep the existing message: **Know what a smart contract can do.** Make the analyzer the dominant object, reduce supporting microcopy, and visually establish Analyze as the primary product path.

### Phase 3 — Analyze

Make the result decision-led. Prioritize: decision → rationale → capabilities → evidence → actions. Keep raw JSON collapsed and secondary.

### Phase 4 — Telegraph Application

Keep the six-step conceptual workflow, but render it as a restrained progress rail. Make **Evidence-backed assessment** the primary result surface. Telegraph metadata becomes provenance, not the headline.

### Phase 5 — Passport

Treat the Passport like a shareable professional observation artifact: identity, posture, capabilities, fingerprint, composition, verification.

### Phase 6 — Evidence

Use a forensic reading model: observation → method → source → evidence → confidence. Reduce visual noise and make individual findings inspectable.

### Phase 7 — Watch

Use a timeline/longitudinal model rather than another generic card dashboard.

### Phase 8 — Telegraph hub and protocol pages

Keep Miner/Evaluation/Application distinct by audience while maintaining the same brand shell. Application remains the recommended judge path.

### Phase 9 — Final polish

Check mobile at 360/390/430px, desktop at ~1280px, focus states, overflow, contrast, button hierarchy, and consistency. No product behavior changes.

## Acceptance criteria

- No body copy below 13px except deliberate micro-labels.
- No more than three visual surface levels per page.
- One primary CTA per page state.
- Primary decision is visually dominant over metadata.
- Telegraph uses violet only for external-intelligence semantics.
- Mint is reserved for established/confirmed primary states.
- No page feels like a generic crypto dashboard.
- Existing API contracts, URLs, form behavior, and evidence semantics remain unchanged.
- Mobile content remains readable without zooming.
