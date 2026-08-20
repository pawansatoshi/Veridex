# Veridex — Persistent Project State

> Single source of truth for continuation across chats, agents, IDEs and sessions.

**Last reviewed:** 20 Aug 2026
**Repository:** `pawansatoshi/Veridex`
**Branch:** `main`

## Current phase

**H1 Miner Critical Path / Phase 01 FINAL EXIT AUDIT — EVM Analysis Core + Address-First Detection + Telegraph Miner**

Phase 00 is complete. Phase 01 implementation is substantially complete. The formal exit gate remains open until current-commit machine-verifiable runtime/protocol evidence is attached.

## Current H1 wedge

1. Ownership / control
2. Upgradeability / proxy surface
3. Pause capability/state
4. Mint capability/authority where evidence permits

Do not expand this capability matrix before these four are reliable in production.

## Verified implementation

The current `main` implementation contains the EVM analysis core, evidence-first capability model, bounded RPC failure handling, proxy/ownership/pause/mint analysis, deterministic ground-truth evaluator, production API, Telegraph Miner adapter/YAML, production deployment, resilience verification foundation, and performance benchmark harness.

## Current verified production state

- production Miner: `https://veridex-ecru.vercel.app`
- endpoint: `POST /analyze`
- health endpoint has returned HTTP 200 with `ok: true`
- metrics endpoint has returned HTTP 200
- production Vercel deployment has reached READY
- Miner #1001 registration was previously confirmed by Telegraph
- no fabricated ranking, traffic, demand, or score is permitted

## Phase 01 exit rule

Phase 01 MUST NOT be marked PASS from implementation status or HTTP 200 responses alone.

The final PASS requires a successful current-commit verification run containing:

1. unit tests
2. typecheck
3. build
4. security audit
5. production health
6. current Telegraph YAML validation
7. live Telegraph integration/registry verification
8. deployed resilience timeout → circuit-open → recovery evidence
9. real-chain TP/TN/FP/FN/inconclusive/unavailable/error evidence
10. cold/warm p50/p95/p99 benchmark evidence
11. production response-schema evidence
12. deployment corresponding to the final commit

A previous successful run is historical evidence only; it does not close the current-commit gate.

## Telegraph Intent

The repository uses the current canonical `CONTENT_VERIFICATION` Intent declaration. Historical `FRAUD_DETECTION` registration information is retained only as historical context. Current live registry agreement must be proven before the protocol gate is closed.

## Current state

**PHASE 01 NOT YET PASS.**

The next engineering action is to obtain a fresh current-commit CI run and inspect every blocking artifact. If any gate fails, fix the underlying cause and rerun the full verification loop. Do not begin Phase 02 until the Phase 01 exit gate is objectively green.
