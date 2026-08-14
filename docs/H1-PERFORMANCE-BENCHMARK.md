# H1 Miner Performance Benchmark

## Purpose

Telegraph Miner judging is primarily Normalized Performance within the selected Intent. Veridex therefore treats latency and reliability as first-class engineering signals while never sacrificing correctness.

Official judging source: https://hackathon.telegraphprotocol.com/rules

## Metrics to record

For each benchmark run record:

- request count
- success count
- unavailable count
- error count
- timeout count
- p50 latency
- p95 latency
- p99 latency
- cold-start latency
- warm latency
- RPC latency where instrumented
- verification latency where instrumented
- capability-analysis latency where instrumented
- serialization/HTTP overhead where measurable
- provider failure rate
- cache hit rate, if caching is enabled
- duplicate-request coalescing rate, if enabled

## Correctness constraints

Performance optimizations must not:

- turn provider failures into negative contract findings
- treat application-level JSON-RPC reverts as infrastructure outages
- accept malformed bytecode
- scan selector bytes inside PUSH data as executable selectors
- guess unresolved beacon implementations
- downgrade inconclusive evidence into false negatives

## Benchmark corpus

The benchmark should include a balanced set of:

1. verified Ownable contracts
2. verified non-Ownable contracts
3. pausable and non-pausable contracts
4. mintable and non-mintable contracts
5. EIP-1967 proxies
6. direct implementations
7. verified and unverified contracts
8. selector-collision fixtures
9. malformed/truncated bytecode fixtures
10. provider failure/revert fixtures

## Run protocol

1. Pin the commit under test.
2. Pin the chain/RPC provider configuration.
3. Warm the process before the warm-run measurement.
4. Run cold and warm measurements separately.
5. Use bounded concurrency; never create an unbounded request flood.
6. Run enough repetitions to produce stable percentiles.
7. Record errors and inconclusive results separately from successful negative findings.
8. Preserve raw benchmark output as an artifact when possible.
9. Compare subsequent commits against the same corpus and environment.

## Reporting template

```text
commit:
corpus:
provider:
network:
requests:
concurrency:

success:
unavailable:
errors:
timeouts:

p50_ms:
p95_ms:
p99_ms:

false_positive:
false_negative:
inconclusive:
accuracy:

notes:
```

## Interpretation

A lower latency number is not an improvement if it increases false positives, false negatives, provider misclassification, or unjustified certainty. The optimization target is **correct intelligence at predictable latency**.
