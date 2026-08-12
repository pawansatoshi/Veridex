# Veridex — Persistent Project State

> **Single source of truth for continuation across chats, agents, IDEs, and sessions.**
>
> Last reviewed: 2026-08-13

## Mission

Build **Veridex — Verifiable On-Chain Intelligence** into a production-grade, deterministic-first smart-contract intelligence layer that can compete in Telegraph Hackathon 1, serve real applications/agents, and evolve into a persistent product for future Telegraph rounds and mainnet.

Core promise:

> **Know what a contract can do — and know when its powers change.**

Core trust principle:

> **No evidence → no certainty.**

## Current phase

**CURRENT PHASE: H1 Miner Critical Path / Phase 01 — EVM Analysis Core**

Repository: `pawansatoshi/Veridex`  
Default branch: `main`

## Official H1 dates

- **Aug 13–16, 2026:** foundation sprint
- **Aug 17–31, 2026:** Track 1 Miner + Track 2 Script Author window
- **Aug 31–Sep 7, 2026:** Track 3 Applications/Agents window
- **Sep 7, 2026:** H1 final boundary

Official rules currently state Miner judging is 75% Normalized Performance within the chosen Intent and 25% X Engagement & Updates. Track 3 must use real Miners, and Miners must remain live through Track 3. Re-check official sources before protocol-specific implementation because facts may change.

## Immediate objective

**Competitive Telegraph Miner.**

The H1 Miner answers:

> **What important capabilities does this smart contract expose, and what evidence supports that conclusion?**

Initial capability wedge:

1. ownership / control
2. upgradeability / proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

## H1 critical pipeline

```text
User/Application → Telegraph Intent → Contract Address → Strict Validation
→ Chain/RPC → Verification Evidence → Proxy/Code Resolution
→ Capability Analysis → Evidence Normalization → Conclusive/Inconclusive
→ Machine-Readable Miner Response → Performance Measurement → Telegraph Miner
```

## Current implementation state

### Implemented on `main`

- strict TypeScript compiler settings
- EVM address validation primitive
- shared `CheckResult` / analysis type foundation
- additive detection/fallback provenance fields
- Vitest unit-test foundation
- bounded runtime configuration with validated RPC URL and numeric limits
- circuit breaker and RPC failure classification
- resilient JSON-RPC client with timeout, bounded retry and malformed-response handling
- application-level JSON-RPC errors/reverts separated from infrastructure failures
- adversarial RPC/circuit regression tests
- bounded EVM bytecode decoder
- instruction-boundary EVM walker with correct PUSH operand handling
- PUSH4 selector candidate extraction only from real instruction boundaries
- regression coverage for PUSH-data selector decoys and truncated/malformed bytecode

### Partially implemented

- runtime foundation: transport/resilience implemented; telemetry and bounded concurrency remain
- EVM bytecode: structural walker implemented; capability semantics and selector-collision evaluation remain
- RPC: core client implemented; real-provider integration and latency measurement remain

### Not yet implemented on `main`

- verification client
- evidence normalization runtime
- ownership runtime check
- pause runtime check
- mint runtime check
- proxy resolver
- analysis orchestrator
- normalized Miner response runtime
- ground-truth corpus
- Telegraph adapter
- live Miner endpoint
- performance harness
- Passport / Watch / Change Intelligence / Policy
- alerts/email/webhook/mobile
- web/PWA/native mobile

A separate `phase-01-core` branch exists, but **main is the source of truth**. Do not claim code from that branch is merged without verification.

## H1 task classification

### H1_CRITICAL

- runtime/resilience foundation — **IN PROGRESS**
- verification/evidence hierarchy
- instruction-aligned bytecode analysis — **STRUCTURAL FOUNDATION IMPLEMENTED**
- ownership/pause/mint
- minimum proxy-aware semantics
- adversarial regression tests
- official Telegraph Intent selection/adapter after source verification

### H1_OPERATIONAL

- live Miner deployment
- performance measurement
- operational reliability
- ground-truth evaluation
- legitimate Track 3 usage
- X transparency/progress

### POST_H1

- expanded proxy composition
- Capability Intelligence expansion
- Capability Passport
- Watch
- Change Intelligence / Time Machine
- Policy Engine
- alert channels
- production web/PWA
- premium UX/3D
- native mobile
- agent/enterprise evolution

### BLOCKED UNTIL VERIFIED

- Telegraph Intent selection until the official supported-intents contract is inspected
- official Telegraph addresses/constants until verified from current official sources
- numerical Veridex scoring until evaluation requirements and ground truth justify it
- beacon implementation claims without actual resolution

## Security requirements

H1 security remains mandatory:

- strict input validation
- malformed bytecode/ABI safety
- bounded parser work
- instruction-boundary scanning
- RPC timeout and bounded retries
- circuit breaker
- application-level revert classification
- provider failure cannot become contract evidence
- client input cannot become canonical evidence
- bounded resource consumption
- no secrets in client code
- dependency/CI security basics
- adversarial regression tests

## Long-term product vision — preserved

```text
UNDERSTAND → VERIFY → DISCOVER POWERS → WATCH → CONNECT
```

Preserved post-H1 architecture includes Capability Passport, Watch, Change Intelligence, Time Machine, Policy Engine, evidence-backed posture/ranking, channel-agnostic alerts, email/webhook/mobile, PWA/native mobile, 3D Contract Core, agents/API/SDK/MCP and enterprise tooling.

## Next engineering task

**Build the verification/evidence foundation:** a provider abstraction that distinguishes `not_configured`, `unverified_contract`, `api_failure`, `timeout`, and `malformed_response`, then normalize provenance without silently downgrading evidence.

## Verification status

Tests have been authored for the implemented runtime and bytecode primitives. The available environment could not execute the repository locally because outbound GitHub DNS resolution failed, and the existing CI connector does not expose a push-run for this commit. Therefore **do not claim CI-passing status yet**; the next CI-capable run must verify typecheck and the complete Vitest suite.

## Last verified commit

`3d81d7a8aa5f842f73a1929f4db68dda23421e23` — H1 runtime/RPC resilience plus EVM instruction-boundary bytecode foundation and regression tests.
