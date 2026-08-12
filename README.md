# Veridex

**Verifiable On-Chain Intelligence**

Veridex is a deterministic smart-contract intelligence system being engineered for Telegraph Protocol.

It turns on-chain contract observations into auditable, machine-readable signals with explicit evidence provenance, confidence, and failure semantics.

## Mission

Build a high-performance, evidence-first intelligence layer that agents can trust because every meaningful conclusion can be traced to the observation that produced it.

## Design principles

- deterministic before probabilistic
- evidence before explanation
- proxy-aware analysis
- verified ABI preferred over selector heuristics
- infrastructure failures must not become false contract signals
- every fallback is observable
- independently testable domain checks
- Telegraph-facing integration remains separate from analysis logic
- animations represent real analysis state, never fabricated certainty

## Current architecture

```text
contract address
      |
      v
validated transport + evidence acquisition
      |
      v
proxy / implementation evidence
      |
      v
independent deterministic checks
      |
      v
evidence + provenance + confidence
      |
      v
normalized intelligence result
      |
      +--------------------+
      |                    |
      v                    v
Telegraph Miner        Veridex Web
      |                    |
      +---------+----------+
                v
        agents / applications
```

## Project continuity

If you are a new agent, start here:

1. [`PROJECT_STATE.md`](PROJECT_STATE.md) — current status, roadmap, decisions, next action
2. [`AGENTS.md`](AGENTS.md) — mandatory engineering/continuity rules
3. [`CLAUDE.md`](CLAUDE.md) — Claude Code context
4. [`docs/ROADMAP.md`](docs/ROADMAP.md) — master phase roadmap
5. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — detailed architecture
6. [`docs/DECISIONS.md`](docs/DECISIONS.md) — durable architecture decisions
7. [`docs/TELEGRAPH_REFERENCE.md`](docs/TELEGRAPH_REFERENCE.md) — official Telegraph reference map
8. [`docs/UI-UX-BLUEPRINT.md`](docs/UI-UX-BLUEPRINT.md) — product, motion, and UX blueprint
9. [`docs/phases/PHASE-01-EVM-CORE.md`](docs/phases/PHASE-01-EVM-CORE.md) — current implementation phase

These files are part of the product architecture. Keep them updated after meaningful milestones so another chat or agent can continue without reconstructing history.

## Status

**Phase 01 — EVM Analysis Core (in progress)**

The repository is being built around deterministic evidence, explicit uncertainty and measurable evaluation performance rather than demo-only functionality.

## Development

Node.js 20+ and npm are recommended.

```bash
npm ci
npm run typecheck
npm test
```

## Official Telegraph references

- [Telegraph Docs](https://docs.telegraphprotocol.com/docs)
- [Hackathon Rules](https://hackathon.telegraphprotocol.com/rules)
- [Supported Intents](https://hackathon.telegraphprotocol.com/supported-intents)
- [Official Use Cases](https://github.com/telegraphprotocol/telegraph-usecases)

## License

TBD during the initial architecture phase.
