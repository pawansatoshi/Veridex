# Veridex

**Verifiable On-Chain Intelligence**

Veridex is a deterministic smart-contract intelligence Miner designed for Telegraph Protocol.

It turns on-chain contract observations into auditable, machine-readable signals with explicit evidence provenance, confidence, and failure semantics.

## Design principles

- deterministic before probabilistic
- evidence before explanation
- proxy-aware analysis
- verified ABI preferred over selector heuristics
- infrastructure failures must not become false contract signals
- every fallback is observable
- independently testable domain checks
- Telegraph-facing integration remains separate from analysis logic

## Current architecture

```text
contract address
      |
      v
proxy / implementation resolution
      |
      v
independent deterministic checks
      |
      v
evidence + provenance + confidence
      |
      v
normalized analysis result
      |
      v
Telegraph Miner adapter
```

## Status

Early architecture/build stage. The repository is intentionally being built around verifiability and evaluation performance rather than demo-only functionality.

## Development

Node.js 20+ and npm are recommended.

```bash
npm install
npm test
npm run typecheck
```

## License

TBD during the initial architecture phase.
