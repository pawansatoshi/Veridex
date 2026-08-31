# Veridex — FINAL Roadmap Status

Last consolidated: 2026-08-31
Branch: `track2-v10-hardening`
Current Track-2 source head: `e6d4694be3e19d39e158b22fbac513cb7f69c10e`
Current PR: #203 (draft, open)

## Status semantics

- **COMPLETE** — implementation plus sufficient current/historical evidence supports the claim.
- **PARTIAL** — implementation exists but one or more meaningful validations remain.
- **INCOMPLETE** — material work is missing.
- **BROKEN** — current implementation/candidate must not be promoted.
- **UNVERIFIED** — evidence is insufficient to make a stronger claim.
- **BLOCKED** — cannot proceed until an external dependency/gate resolves.

## Global completion matrix

| Area | Status | Evidence | Remaining work | Risk | Priority | Validation |
|---|---|---|---|---|---|---|
| Core EVM analysis | COMPLETE | existing domain implementation + CI | none for Track 2 release | Medium | P2 | tests/CI |
| Proxy-aware composition | COMPLETE | implementation + tests | none for Track 2 release | Low | P2 | CI |
| Track 1 Miner | COMPLETE / LIVE | existing Miner, registration and production integration | final submission smoke only | Medium | P1 | production/Telegraph |
| Track 2 historical compact V6/V7 | COMPLETE AS HISTORY | preserved source and rejection evidence | no promotion | Low | P3 | regression/reference |
| Track 2 V9 | BROKEN / REJECTED | historical audit | retain only | High | P3 | source audit |
| Track 2 neural V10.1 | PARTIAL / ACTIVE CANDIDATE | pinned MIT baseline + Veridex wrapper + fast path | current head must pass complete gates | Critical | P0 | CI |
| Primary benchmark | PARTIAL | previous fast candidate: 3/55 inversions | current head must reach 0 | Critical | P0 | preflight/tournament |
| Contract-security benchmark | UNVERIFIED CURRENT HEAD | suite exists | fresh current-head run | High | P0 | preflight/tournament |
| Adversarial mutation | UNVERIFIED CURRENT HEAD | prior candidate had 157/157 | fresh current-head run | High | P0 | mutation suite |
| Public hard.json | UNVERIFIED CURRENT HEAD | strict gate exists | fresh current-head run | High | P0 | public checker |
| Public Wazero | UNVERIFIED CURRENT HEAD | prior CI reached checker; live #2084 exceeded Telegraph budget | fresh current-head strict checker + performance margin | Critical | P0 | Wazero |
| Track 2 exact artifact/hash | UNVERIFIED | exact binary generated per CI; not frozen | green CI then hash freeze | Critical | P0 | CI |
| Track 2 live registration | BLOCKED BY GREEN GATE | #2084 rejected for 10m40s live budget | green exact candidate + fresh registration | Critical | P0 | Telegraph |
| Track 2 live competitive result | UNVERIFIED | no accepted current artifact | live Stage-2 result | Critical | P0 | Telegraph |
| Track 3 application | COMPLETE / PRESENTATION READY | existing app routes/UI | final smoke only | Medium | P1 | production/browser |
| Security | PARTIAL | zero-import WASM + existing controls | final dependency/input/log review | Medium | P1 | CI/security |
| CI/CD | PARTIAL / HARDENED | final Track-2 workflow; docs-only changes no longer trigger expensive run | fresh full green current-head run | Medium | P1 | Actions |
| Deployment | PARTIAL / OPERATIONAL | Vercel deployment/health paths | final smoke | Medium | P1 | production |
| Documentation | PARTIAL / HARDENED | master context, blueprints, matrix, validation report, roadmap | final exact hash/live result synchronization | Low | P1 | review |
| Hackathon Track 2 submission | BLOCKED | no accepted current registration | acceptance + exact form submission | Critical | P0 | official submission |

## Current Track 2 architecture

`pinned official MIT MiniLM/BM25 semantic foundation → Veridex factual-integrity wrapper → deterministic bounded score → release gates`

Current performance candidate:

- `MAX_SEQ_LEN = 64`
- maximum transformer layers executed = `5`
- zero WASM imports
- binary target remains <=32 MiB

## Current blocker

The last fully observed fast candidate built successfully and passed structural validation but failed primary preflight on three equivalence/value pairs. The current source has a context-aware, non-early-return correction intended to resolve those without bypassing entity, contradiction or numeric mismatch guards.

The last observed CI run (#124) was:

- build: PASS
- structural: PASS
- size: 24,194,340 bytes
- imports: 0
- primary preflight: FAIL, 3 inversions / 55 pairs
- self-match: 1.0
- score stddev: 0.4222

## Historical live runtime blocker

Registration #2084 was rejected by Telegraph at `10m40s elapsed, including module load`. This is treated as a separate runtime gate. CI runtime length is not the Telegraph runtime budget.

## Release state machine

`IMPLEMENTED → CI VALIDATED → PUBLIC CHECKER PASSED → HASH FROZEN → REGISTERED → ACCEPTED → LIVE COMPETITIVE EVIDENCE → SUBMITTED`

## Non-negotiable release rule

**No green gate → no registration.**

A changed binary requires a new hash and fresh registration. A pending registration is not acceptance. Local benchmark success does not prove hidden Stage-2 placement.
