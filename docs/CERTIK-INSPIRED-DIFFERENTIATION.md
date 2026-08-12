# CertiK-Inspired Differentiation — Product Research

## Purpose

CertiK's Skynet demonstrates that security intelligence becomes more useful when it is translated into understandable scores, categories, monitoring, alerts, leaderboards and integrations. This is a product-pattern reference, not a design to copy.

CertiK currently describes Skynet as a real-time Web3 security evaluation system using multiple signals and categories, with automatic signals calculated by monitoring systems. Its public product also exposes security scores, rankings, project profiles, monitoring, alerts, token-risk intelligence and API integrations. Source: official CertiK product and Skynet materials.

## What Veridex should borrow as product principles

### 1. At-a-glance posture

Give users an immediate understanding of the current contract posture without requiring them to read raw evidence first.

### 2. Explainable dimensions

Never expose only one opaque number. Show the underlying dimensions and let the user open the evidence supporting each one.

### 3. Highlights & alerts

A compact "What changed / what matters" layer should summarize meaningful observations. Alerts must be evidence-backed and distinguish change from inconclusive infrastructure failures.

### 4. History and monitoring

The Veridex Watch model should make security posture a time series rather than a one-time scan.

### 5. Developer distribution

The same intelligence should be consumable through structured API/Miner responses so wallets, agents, dashboards and other applications can use it.

## What Veridex must do differently

Veridex is not a CertiK replacement and should not imitate a broad project-level security rating.

CertiK's public Skynet model spans project-level security, operational, community, market and governance signals. Veridex's initial wedge is narrower and more rigorous:

**contract-level, evidence-backed capability intelligence.**

Veridex should answer:

- What contract is this?
- Is it a proxy, and what execution address is actually established?
- What powers/capabilities are observable?
- What evidence established each finding?
- How conclusive is the finding?
- What changed since the previous verified observation?
- Can an agent consume the same evidence?

## Proposed Veridex score model

Do not call the primary number a generic "security score".

Use a future **Veridex Posture** or **Capability Posture** composed of explainable dimensions, for example:

- Control Surface
- Upgrade Surface
- Token Authority
- Emergency Controls
- Evidence Quality
- Observation Freshness

These are not implemented or numerically weighted yet. Scoring must wait until the evidence model and Telegraph evaluation requirements are established.

### Critical rule

A missing observation must not automatically become a bad score. Infrastructure failure, unsupported capability, not-applicable state, unavailable external verification and an actual negative security finding are separate states.

## Proposed visual experience

A result page may eventually show:

`CAPABILITY POSTURE`

with a calm radial or linear visualization and six compact dimensions.

Below it:

`Highlights`

- Implementation changed
- Mint capability detected
- Owner changed
- Evidence verification degraded

Then:

`Why?`

opens the exact evidence chain.

Then:

`Timeline`

shows posture changes over time.

Then:

`Agent Output`

exposes the machine-readable representation.

## Leaderboards — future only

A Veridex leaderboard can be considered later for opt-in tracked contracts or protocol cohorts, but it must never imply that a higher Veridex number means a contract is universally safe.

Possible future comparisons:

- strongest evidence quality
- most stable control surface
- largest verified capability change
- protocol cohort posture

This should remain separate from Telegraph's official Miner ranking and canonical evaluation.

## Competitive moat

The product combination we want is:

**CertiK-like clarity**
+
**Veridex evidence provenance**
+
**Capability Passport**
+
**persistent Watch**
+
**before/after capability diff**
+
**agent-native structured output**
+
**Telegraph Miner distribution**

The differentiator is not "we also have a score." The differentiator is:

> **Every meaningful posture change can become a verifiable, explainable, machine-readable event.**

## Source boundary

This document uses CertiK's official public product materials only as product research. It does not reproduce CertiK methodology, proprietary scoring weights, branding, UI assets, or claims as Veridex functionality.

Reference:
- https://www.certik.com/products/skynet
- https://www.certik.com/products/skynet-score
- https://skynet.certik.com/skynet-101/skynet-security-score
