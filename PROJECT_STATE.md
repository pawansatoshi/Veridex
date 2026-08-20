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

## Phase 01 exit rule

Phase 01 MUST NOT be marked PASS from implementation status or HTTP 200 responses alone.

The final PASS requires a successful current-commit verification run containing unit tests, typecheck, build, security audit, production health, current Telegraph YAML/integration verification, deployed resilience recovery evidence, real-chain TP/TN/FP/FN/inconclusive/unavailable/error evidence, cold/warm p50/p95/p99 benchmark evidence, production response-schema evidence, and a deployment corresponding to the final commit.

## Current state

**PHASE 01 NOT YET PASS.**

Do not begin Phase 02 until the Phase 01 exit gate is objectively green.
