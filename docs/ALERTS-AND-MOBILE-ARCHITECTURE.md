# Veridex Alerts & Mobile-Ready Architecture

## Decision

Veridex must be channel-independent from the beginning. Contract intelligence, watch state, policy evaluation and alerts belong to backend/domain services; the web interface is only one client. This preserves a clean path to native mobile applications without rebuilding the intelligence engine.

## Alert pipeline

`Observation → Evidence reconciliation → Capability diff → Policy evaluation → Alert event → Notification router`

Notification channels are adapters, not analysis logic.

Initial planned channels:

- in-app notification center
- email
- webhook / API callback

Future channels:

- native mobile push
- optional messaging integrations where justified

## Email alerts

Email is a first-class product channel for Veridex Watch.

A high-value alert should answer immediately:

1. Which contract changed?
2. What changed?
3. When was the change observed?
4. Is the comparison conclusive?
5. What evidence supports the finding?
6. Did a user-defined policy become violated?
7. Where can the user inspect the full before/after evidence?

Example structure:

**Veridex Watch — Contract capability changed**

- Contract: human label + shortened address
- Network: chain
- Change: implementation changed
- Previous: `0x...`
- Current: `0x...`
- Evidence status: verified / degraded / inconclusive
- Policy impact: none / warning / violation
- Observed at: timestamp
- CTA: Review evidence

Never send a material capability-change email when the observation is merely inconclusive because an infrastructure provider failed.

## Alert severity and noise control

Veridex must avoid alert fatigue.

Notification policy should support:

- critical material changes immediately
- warnings based on user policy
- configurable digest for low-priority observations
- deduplication
- cooldown windows for repeated identical events
- per-watch notification preferences

A change event and a provider-health event are different event classes.

## Mobile-ready product architecture

The long-term client model is:

`Veridex Intelligence Platform → Versioned API / realtime event interface → Web / Mobile / Agents / Telegraph`

No security analysis rule should live only inside the web frontend.

Shared platform capabilities:

- authentication and account identity
- watchlists
- Capability Passports
- contract labels
- historical observations
- Capability Time Machine
- policy definitions
- alert preferences
- notification history
- evidence records
- API/agent access

Clients:

### Web

Full spatial Evidence Explorer, advanced comparisons, policy management and developer detail.

### Mobile

Fast monitoring experience optimized around:

- Watchlist
- Alerts
- Contract Passport
- Before / After
- simple evidence explanation
- push notification deep links
- biometric/session security where appropriate

The native mobile UI should not attempt to reproduce every desktop 3D interaction. It should preserve the same information hierarchy with lightweight motion and excellent one-handed navigation.

### Agents / API

Stable structured intelligence, evidence and policy state without presentation concerns.

### Telegraph Miner

A protocol adapter consuming the same intelligence core. Telegraph-specific transport/economic behavior must not leak into domain analysis.

## Realtime model

The architecture should permit event-driven client updates. A contract observation can emit normalized domain events such as:

- `observation.completed`
- `observation.inconclusive`
- `capability.changed`
- `implementation.changed`
- `ownership.changed`
- `policy.violated`
- `evidence.degraded`

Exact event schemas will be versioned when implementation begins.

## Cost discipline

Persistent Watch must not become uncontrolled polling infrastructure.

Use, where justified:

- adaptive observation cadence
- event-driven triggers when semantically reliable
- batching
- caching
- deduplication
- bounded concurrency
- per-watch resource budgets
- alert deduplication

Notification delivery must be asynchronous from the critical analysis path so a mail-provider failure cannot invalidate a contract observation.

## Privacy and security

Email addresses and notification preferences are account data, not evidence data. Keep them outside immutable/public evidence structures.

Do not expose private watchlists through public APIs by default.

Do not include sensitive account/session data in notification links.

## Product tiers — future possibility, not current pricing commitment

The architecture should permit future differentiation by number of watched contracts, observation frequency, policy depth, notification channels, retention and API volume. No pricing or limits are fixed at this stage.

## UX principle

The user should experience Veridex as:

**Add once → Veridex watches → something material changes → the right channel tells me → I can immediately see why.**

This remains the same whether the client is web, email, mobile push or an autonomous agent.