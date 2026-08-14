# Telegraph Protocol Reference for Veridex

> Living reference. Verify current official docs before implementing protocol-specific behavior.

## Official sources

- Hackathon: https://hackathon.telegraphprotocol.com/
- Rules: https://hackathon.telegraphprotocol.com/rules
- Docs: https://docs.telegraphprotocol.com/docs
- Intents reference: https://github.com/telegraphprotocol/telegraph-docs/blob/main/using/intents.md
- Official use cases: https://github.com/telegraphprotocol/telegraph-usecases

## Verified H1 rules — 2026-08-14

The official rules state:

- Track 1 Miners: Aug 17–Aug 31, 2026
- Track 2 Script Authors: Aug 17–Aug 31, 2026
- Track 3 Applications: Aug 31–Sep 7, 2026
- Winner selection: Sep 8–Sep 18, 2026
- Announcement/prizes: Sep 19–Sep 25, 2026
- Miner judging: 75% Normalized Performance within the chosen Intent + 25% X Engagement & Updates
- Each Intent has an independent leaderboard.
- Global cash-prize guardrail: an Intent needs at least 3 active Miners and at least 100 real Track 3 requests.
- Track 3 applications must use real Telegraph Miners; mocked/simulated data is prohibited.
- Miners and Script Authors must remain live and operational throughout Track 3.
- Judging updates must be public on X and tagged `@Telegraphprotoc`.
- Artificial metric inflation/gaming can disqualify a participant.
- Participants must join the official Hackathon Discord and remain active.

## Performance interpretation

The rules do not define a standalone "speed percentage". Performance is represented primarily by the Intent-specific Canonical Score and then normalized against the best Miner in that Intent. Veridex therefore measures latency, failure rate and reliability as engineering inputs to high-quality Miner performance, but must not claim a separate official speed score.

## Intent policy

An Intent is a specific category of intelligence and each Intent has its own leaderboard. Veridex must compete only where the selected Intent's request/response/evaluation semantics actually match the service.

The current accessible official materials do not provide a verified dedicated `smart-contract-capability` Intent contract. The repository therefore deliberately keeps `src/miner/telegraph.ts` schema-neutral rather than inventing an Intent or mapping capability intelligence to an unrelated domain.

Before implementing a protocol adapter, verify from the current official protocol/H1 support channel:

- exact Intent identifier
- request schema
- response schema
- canonical/evaluation semantics
- confidence/deadline fields if applicable
- supported networks
- Miner YAML/configuration fields
- registration flow
- health/readiness requirements
- payment/x402 requirements where applicable

Once verified, implement the smallest adapter and protocol regression suite at the existing schema boundary.

## Veridex Miner scope

H1 deterministic capability wedge:

1. ownership/control
2. upgradeability/proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

Response principles:

- structured machine-readable evidence
- explicit detection method
- provider/API status
- confidence
- conclusive/inconclusive state
- honest fallback reason
- contractAddress vs codeAddress separation

## Evidence hierarchy

Tier 1 — verified ABI/source evidence.

Tier 2 — verified source/structural evidence where actually supported.

Tier 3 — bytecode fallback with instruction-boundary scanning.

Selector presence alone is never treated as semantic proof.

## Ground truth and performance

H1 requires a reproducible ground-truth strategy covering positives, negatives, proxies, verified/unverified contracts and adversarial bytecode. Veridex records TP/TN/FP/FN/inconclusive/unavailable/error and p50/p95/p99 latency. See `docs/H1-GROUND-TRUTH.md` and `docs/H1-PERFORMANCE-BENCHMARK.md`.

## Track 3 strategy

Track 3 is not a documentation exercise. The Miner must remain live and real applications/agents must consume it. Veridex should pursue legitimate application utility and demand without manufacturing traffic.

## Update procedure

When Telegraph changes:

1. verify the official source
2. update this file
3. add a decision entry if architecture changes
4. update the affected phase
5. run regression tests
6. record migration notes.
