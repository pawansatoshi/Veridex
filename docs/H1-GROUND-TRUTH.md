# Veridex H1 Ground Truth

## Purpose

H1 correctness is evaluated independently from production analysis. The evaluator knows the expected answer; production code never receives hidden ground-truth branches.

## Required corpus

The corpus must contain:

- Ownable / ownership present
- non-Ownable
- paused / unpaused state where supported
- pausable / non-pausable
- mintable / non-mintable
- proxy / non-proxy
- verified / unverified
- malformed ABI
- malformed/truncated bytecode
- selector collision
- known selector embedded in PUSH data
- RPC application revert
- RPC provider failure
- verification timeout/API failure
- unresolved implementation
- beacon proxy with successful resolution
- beacon proxy with unresolved implementation

## Current repository corpus

`src/evaluation/ground-truth.ts` contains the versioned H1 case definitions and `evaluateGroundTruth()` reports:

- true positives
- true negatives
- false positives
- false negatives
- inconclusive
- unavailable
- errors
- evaluated accuracy

The current cases are intentionally capability-level fixtures. They are not presented as real-chain ground truth until each address is independently verified against source/ABI and live state.

## Real-chain gate

Before the H1 Miner is called benchmark-ready, add a curated real-chain corpus with provenance for every case:

```text
case id
network
contract address
code address / implementation when applicable
verification source
expected ownership
expected upgradeability
expected pause
expected mint
expected live pause state when applicable
verification date
block/observation metadata
```

A provider outage must never alter expected labels. Real-chain cases should be independently checked from a second source or from source/ABI plus live calls.

## Selector-collision policy

A known four-byte selector in fallback bytecode is **not** a positive ground-truth result. It is an inconclusive observation unless stronger evidence establishes the function semantics.

A selector appearing inside PUSH data is not a candidate at all.

## Performance metrics

The H1 benchmark must record:

- end-to-end latency
- RPC latency
- verification latency
- analysis latency
- serialization latency
- provider failure rate
- timeout rate
- cache hit rate when caching is introduced
- p50 / p95 / p99

Correctness is never traded for lower latency.
