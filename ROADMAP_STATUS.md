# Veridex Current Roadmap Status

Last audited against repository state and the V10 hardening branch on 2026-08-30.

| Area | Status | Evidence | Remaining work | Risk | Priority | Validation |
|---|---|---|---|---|---|---|
| Core EVM analysis | COMPLETE | `src/domain`, historical phase gates | Fresh production verification when required | Medium | P2 | historical CI + current tests |
| Proxy-aware composition | COMPLETE | `src/infrastructure/proxy-composition.ts`, tests | Fresh CI verification on current head | Low | P2 | unit/CI |
| Track 1 Miner | COMPLETE / LIVE REGISTRATION | Miner `1001`, registration `#144` documented | Fresh live operational check | Medium | P1 | production + Telegraph |
| Track 2 compact V9 | BROKEN / NOT PROMOTED | `veridex_evaluator_v9.c` | Retain only for regression/reference | High | P0 | source audit proves breakdown/16-bit weaknesses |
| Track 2 neural V10 | PARTIAL | `neural/build_candidate.py`, V10 hardening PR | Fresh CI build, all gates, exact hash | Critical | P0 | in-progress CI |
| Track 2 benchmark | PARTIAL | 50-case `track2-benchmark-v2.json` | Validate correlation against incumbent; broaden only when evidence supports it | High | P0 | tournament + incumbent comparison |
| Track 2 diagnostics | PARTIAL → HARDENING | preflight/tournament/mutation suite | Fresh CI output and failure-driven tuning | High | P0 | CI |
| Track 3 application | COMPLETE / PRESENTATION READY | `/telegraph/application/`, Analyze/Evidence/Passport/Watch surfaces | Fresh production UX smoke test; durable Watch remains post-H1 | Medium | P1 | production + browser |
| Security | PARTIAL | `SECURITY.md`, input validation, headers | Fresh dependency/security scan; continue API error-boundary hardening | Medium | P1 | CI/security tooling |
| CI/CD | PARTIAL → HARDENING | multiple workflows; V10 final workflow | Consolidate duplicate lanes and ensure current-main status is observable | Medium | P1 | Actions |
| Deployment | PARTIAL / OPERATIONAL | Vercel endpoint documented | Fresh health/production schema/real-chain checks | Medium | P1 | production checks |
| Documentation | PARTIAL → HARDENING | master context, BUILD, release docs | Keep status fields synchronized with actual evidence | Low | P1 | review |
| Hackathon submission | UNVERIFIED | no claim of final Track 2 acceptance | Accepted exact artifact + live evaluation + exact submission record | Critical | P0 | Telegraph |

## Status semantics

- **COMPLETE** means implementation and historical/current evidence support the claim.
- **PARTIAL** means code exists but at least one required validation or production proof is missing.
- **BROKEN** means the candidate must not be promoted.
- **UNVERIFIED** means no sufficient evidence exists to make the claim.

## Current critical path

`V10 source → CI build → static gates → preflight → tournament → mutation suite → public Wazero checker → exact SHA-256 → registration → Telegraph acceptance → live competitive result`

No registration should occur before the complete green gate.
