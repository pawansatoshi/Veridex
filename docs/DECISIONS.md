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

**Rationale:** Telegraph's own evaluation/ranking mechanism is part of the hackathon objective. Internal risk aggregation should not distort the expected Miner response prematurely.

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

**Consequences:** current work prioritizes correctness, exact Intent compatibility, latency/reliability and real utility before UI breadth or speculative features. The product can evolve without rewriting the analysis core if Telegraph changes an Intent or transport.

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
