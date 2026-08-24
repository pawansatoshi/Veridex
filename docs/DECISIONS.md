# Veridex Architecture Decision Log

Durable decisions live here so a future chat/agent does not reopen settled questions without new evidence.

## D001 — Product Name

**Decision:** Veridex.

**Rationale:** Distinctive positioning around verifiable intelligence rather than generic smart-contract security branding.

## D002 — Core Product Thesis

**Decision:** deterministic, evidence-first on-chain intelligence.

**Rationale:** Telegraph rewards Miner performance and reliable intelligence. Veridex should expose auditable facts rather than hide uncertainty behind an opaque model.

## D003 — Evidence Hierarchy

**Decision:** verified ABI/source evidence is stronger than raw selector heuristics; instruction-aligned bytecode is fallback evidence.

**Rationale:** 4-byte selector collisions are real, and arbitrary byte scanning can produce false positives inside PUSH operands.

## D004 — Proxy Semantics

**Decision:** separate code address from live-state/storage address.

**Rationale:** delegatecall proxies execute implementation code against proxy storage. Capability detection and live state therefore have different address semantics.

## D005 — Beacon Proxies

**Decision:** a detected beacon address is not treated as an implementation address.

**Rationale:** the beacon slot identifies a beacon contract. The implementation must be resolved through the supported beacon interface before capability inspection.

## D006 — Error Classification

**Decision:** application-level contract reverts are not transport failures.

**Rationale:** a valid RPC round trip that returns a contract revert must not trip the infrastructure circuit breaker.

## D007 — Fallback Transparency

**Decision:** every fallback/degradation path is observable.

**Rationale:** unverified, unconfigured, API failure, malformed data, timeout, and unsupported behavior have different meanings and must not be silently collapsed.

## D008 — Shared Result Contract

**Decision:** evidence fields are additive and optional until downstream consumers prove they need stronger normalization.

**Rationale:** avoid breaking existing modules or inventing semantics for future scoring.

## D009 — Scoring Deferral

**Decision:** do not invent a large proprietary scoring engine before the Telegraph Intent and canonical evaluation contract are verified.

**Rationale:** Telegraph's evaluation/ranking mechanism is part of the hackathon objective. Internal risk aggregation should not distort the expected Miner response prematurely.

## D010 — UI Animation

**Decision:** animations represent real analysis state transitions.

**Rationale:** credibility is central to Veridex. Decorative fake progress would undermine the evidence-first product thesis.

## D011 — Official Contract Registry

**Decision:** official Telegraph contract addresses/constants are maintained in a versioned registry with source provenance and verification metadata.

**Rationale:** blockchain constants are high-risk correctness inputs and must not be copied from memory or unofficial sources.

## D012 — Autonomous Engineering Workflow

**Decision:** implementation decisions are made from repository state, official sources, documented constraints, and measured evidence rather than requiring the user to dictate individual files/tests.

**Rationale:** Veridex is being built as a serious product and must retain continuity across chats and future agents.

## D013 — Multi-Hackathon Product Strategy

**Date:** 2026-08-13

**Context:** Telegraph is running a multi-round ecosystem in which early Miner performance and application demand feed into later rounds and eventual mainnet incentives.

**Decision:** Veridex architecture is optimized for Hackathon 1 performance without becoming a one-round prototype. The core analysis engine remains Telegraph-independent; Telegraph integration is a replaceable adapter; evaluation is isolated; future H2/H3 capabilities are added only from measured demand and benchmark evidence.

**Alternatives considered:** optimize solely for the current hackathon; build a broad feature-heavy security scanner before establishing evaluation fit; tightly couple the domain to Telegraph transport.

**Evidence:** official Telegraph hackathon rules/site and official documentation emphasize Miner performance, real application usage, verified intelligence, and an evolving multi-round ecosystem.

**Consequences:** current work prioritizes correctness, exact Intent compatibility, latency/reliability and real utility before UI breadth or speculative features.

## D014 — Capability Passport & Change Intelligence

**Date:** 2026-08-13

**Context:** A one-shot scanner is easy to imitate and only answers what a contract appears to expose at one observation point.

**Decision:** Veridex will develop a versioned Capability Passport and a safe Change Intelligence layer. A passport records the evidence-backed capability/control surface at an observation point. Comparisons classify control/capability changes separately from evidence-quality changes and infrastructure failures. A degraded observation can never imply that a capability was removed.

**Alternatives considered:** remain a one-shot scanner; build a generic alerting system; infer changes from missing data; add a broad vulnerability engine instead.

**Evidence:** current Veridex evidence/provenance architecture and the need to distinguish contract changes from provider/verification failures.

**Consequences:** this becomes a strategic product moat while remaining staged after the deterministic analysis engine.

## D015 — H1 Miner Rebaseline and Capability Conservatism

**Date:** 2026-08-14

**Context:** H1 has a fixed Miner window ending Aug 31, followed by a seven-day Track 3 operational window. The existing repository already contained strong runtime, evidence, bytecode and proxy foundations but did not yet have a normalized Miner result or Telegraph adapter.

**Decision:** keep H1 strictly on the deterministic Miner critical path. Pause and mint are implemented as evidence-first capability checks. Verified ABI evidence may be conclusive; instruction-aligned bytecode selector fallback is explicitly inconclusive because selector collisions exist. Live state queries use `contractAddress`; code/ABI inspection may use `codeAddress`. Mint authorization remains unresolved unless stronger access-control/source evidence proves it.

**Alternatives considered:** build the final UI first; broaden the scanner to many capabilities; treat bytecode selectors as definitive; infer mint authority from function presence.

**Evidence:** repository audit, existing architecture decisions, EVM selector semantics, OpenZeppelin capability/access-control documentation, and current Telegraph hackathon rules.

**Consequences:** the next H1 milestone is a normalized analysis orchestrator, then ground truth and the official Telegraph adapter. Passport, Watch, Policy, mobile and 3D UX remain post-H1.

## D016 — Exact Telegraph Intent Verification

**Date:** 2026-08-24

**Context:** The previous live integration verifier checked only that the Miner advertised canonical Intents. That was insufficient: a Miner registered under a different canonical Intent could pass the integration gate even though the repository's intended Veridex mapping was `FRAUD_DETECTION`.

**Decision:** Veridex's H1 Miner must declare and advertise exactly one Intent, `FRAUD_DETECTION`, and both repository YAML validation and live integration verification must confirm that Intent is canonical in the live Telegraph registry.

**Alternatives considered:** accept any canonical Intent; trust the registration number without checking the live advertised Intent; permit multiple Intents in one Miner.

**Evidence:** current repository registration state, the Veridex H1 intent contract, the official Telegraph YAML semantics contract, and the need for an exact protocol/evaluation mapping.

**Consequences:** an Intent drift now fails CI instead of silently producing a false-green integration result. If Telegraph changes the canonical mapping, the failure becomes an explicit protocol decision requiring new evidence rather than an implicit configuration change.

## How to Add a Decision

Use:

- Decision ID
- Date
- Context
- Decision
- Alternatives considered
- Evidence
- Consequences

Do not silently rewrite an existing decision. Add a superseding decision and link the old one.
