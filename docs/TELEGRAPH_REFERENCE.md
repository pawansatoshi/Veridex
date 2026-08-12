# Telegraph Protocol Reference for Veridex

> Living reference. Verify current official docs before implementing protocol-specific behavior.

## Official Sources

- Docs: https://docs.telegraphprotocol.com/docs
- Hackathon rules: https://hackathon.telegraphprotocol.com/rules
- Supported intents: https://hackathon.telegraphprotocol.com/supported-intents
- Official use cases: https://github.com/telegraphprotocol/telegraph-usecases

## Current Verified Documentation Surface

The official docs currently organize material into:

- protocol fundamentals: how Telegraph works, tokenomics, addresses/parameters, roles
- using Telegraph: direct x402 inference, Engine inference, daemon signal feeds, WebSocket signal subscriptions, ERC-8183 on-chain jobs, MCP server
- running a Miner: what Miners do, YAML configuration, registration
- running a Validator: what Validators do, key management, node setup
- deployment and troubleshooting

## Hackathon Facts

Current official rules state:

- Track 1: Miners — Aug 17–Aug 31, 2026
- Track 2: Script Authors — Aug 17–Aug 31, 2026
- Track 3: Applications — Aug 31–Sep 7, 2026
- Winner selection — Sep 8–Sep 18, 2026
- Announcement/prizes — Sep 19–Sep 25, 2026
- Miner judging: 75% Normalized Performance within the chosen Intent + 25% X Engagement & Updates
- Global-prize guardrail: at least 3 active Miners and at least 100 real Track 3 requests for an Intent
- Track 3 applications must use real Miners; simulated/mock data is prohibited
- Miners must remain live through Track 3
- metric gaming/artificial inflation can disqualify a participant

## Strategic Implications

Veridex should:

1. choose an Intent with a verified request/response and evaluation contract
2. maximize deterministic correctness and canonical performance
3. keep latency low and predictable
4. remain live and observable
5. generate legitimate application utility and demand
6. publish meaningful X progress rather than spam

## Intent Policy

Do not assume that a supported Intent's name automatically matches Veridex semantics. The actual input/output/evaluation contract must be inspected before adapter implementation.

## Miner Policy

Before implementing the Miner adapter, verify the current official:

- request schema
- response schema
- YAML/configuration fields
- registration flow
- payment/x402 requirements
- health/readiness expectations
- evaluation interface
- supported networks
- official contract addresses/parameters

## Official Contract Registry Policy

When official smart-contract addresses are needed, store them only after verifying them against the current official Telegraph documentation/repository.

Required metadata:

```text
network
contract name
address
purpose
source URL
source section/file
verified date
ABI/reference
status
```

No unverified address should enter production configuration.

## Use-Case References

The official `telegraph-usecases` repository contains real Telegraph applications/use cases. Use it as an implementation benchmark for:

- HTTP/API integration
- x402 payment handling where applicable
- response UX
- application-to-Miner boundaries
- proof/transaction presentation
- real application workflows

Do not copy use-case code blindly; adapt only verified patterns to the current official protocol contract.

## Update Procedure

When Telegraph changes:

1. verify the official source
2. update this file
3. add a decision entry if architecture changes
4. update the affected phase
5. run regression tests
6. record migration notes.
