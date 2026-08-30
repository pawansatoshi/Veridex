# Veridex — FINAL Roadmap Status

Last consolidated: 2026-08-30
Branch: `track2-v10-hardening`

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
| Core EVM analysis | COMPLETE | `src/domain` + phase gates | Fresh production smoke when changing core | Medium | P2 | tests/CI |
| Proxy-aware composition | COMPLETE | proxy-composition implementation + tests | Fresh production smoke when relevant | Low | P2 | tests/CI |
| Track 1 Miner | COMPLETE / LIVE | Miner `1001`, registration `#144`, production endpoint | Fresh live operational verification before final submission | Medium | P1 | production/Telegraph |
| Track 2 historical compact V6/V7 | COMPLETE AS HISTORY | preserved source and historical evidence | no promotion | Low | P3 | regression/reference |
| Track 2 V9 | BROKEN / REJECTED | source audit: breakdown/16-bit-offset weaknesses | retain for regression only | High | P0 | source audit |
| Track 2 neural V10.1 | PARTIAL / ACTIVE CANDIDATE | reproducible builder + V10 hardening branch | complete fresh CI, freeze exact artifact | Critical | P0 | CI |
| Track 2 primary benchmark | PARTIAL | current file has 49 cases; previous V10.1 preflight had 55/55 wins | fresh tournament + baseline differential evidence | High | P0 | tournament |
| Track 2 contract-security benchmark | PARTIAL | 6-case supplemental suite | fresh tournament | High | P0 | tournament |
| Track 2 mutation suite | PARTIAL | suite implemented | fresh green run | High | P0 | CI |
| Track 2 public hard.json | PARTIAL | gate implemented | fresh green run | High | P0 | CI/public checker |
| Track 2 public Wazero | BLOCKED / IN PROGRESS | previous run exposed no-dealloc memory growth | verify allocator hardening | Critical | P0 | strict checker |
| Track 2 artifact/hash | UNVERIFIED | hash intentionally not frozen | green CI → exact SHA-256 | Critical | P0 | CI |
| Track 2 registration | BLOCKED BY GREEN GATE | current candidate deliberately not registered | exact green artifact → fresh registration | Critical | P0 | Telegraph |
| Track 2 live competitive result | UNVERIFIED | no accepted current candidate | active registration + Stage-2 result | Critical | P0 | Telegraph |
| Track 3 application | COMPLETE / PRESENTATION READY | `/telegraph/application/` and product routes | final browser/production smoke | Medium | P1 | production/browser |
| Security | PARTIAL | validation/error-boundary/security configuration | fresh dependency scan + final audit | Medium | P1 | CI/security |
| CI/CD | PARTIAL / HARDENING | active final lane + obsolete publishing lanes disabled | prove current head green and preserve artifact evidence | Medium | P1 | Actions |
| Deployment | PARTIAL / OPERATIONAL | Vercel deployment and health tooling | final production smoke | Medium | P1 | production |
| Documentation | PARTIAL / HARDENING | master context, blueprint, BUILD, candidate matrix, validation report | synchronize final CI/registration evidence | Low | P1 | review |
| Hackathon Track 2 submission | BLOCKED | no accepted current artifact | Telegraph acceptance + exact submission record | Critical | P0 | official submission |

## Final Track 2 architecture decision

The old compact rule/lexical line is retained for regression but is **not** the competitive release line. The selected architecture is:

`official MIT MiniLM/BM25 semantic foundation → Veridex factual-integrity wrapper → deterministic bounded score → optional monotonic calibration`

The wrapper protects against high-impact ranking failures without replacing the semantic foundation with a brittle rule system.

## Final Track 2 release gates

A candidate may be promoted only when all are green:

1. reproducible build;
2. valid WASM;
3. required `memory`, `alloc`, `dealloc`, `rank_answer`, `breakdown_answer` exports;
4. zero imports/no WASI/network/filesystem dependency;
5. empty answer exactly `0`;
6. whitespace-only answer exactly `0`;
7. empty ground truth safely handled;
8. exact normalized answer exactly `1`;
9. finite `[0,1]` scores;
10. deterministic repeated execution;
11. deterministic fresh-instance execution;
12. long and >65,535-byte input safety;
13. UTF-8/CJK/emoji/accented/NUL safety;
14. safe allocator/pointer behaviour;
15. breakdown final equals rank score;
16. zero unacceptable local ordering inversions;
17. meaningful score distribution;
18. primary tournament green;
19. contract-security tournament green;
20. mutation suite green;
21. public `hard.json` gate green;
22. strict public Wazero checker green;
23. exact SHA-256 recorded;
24. exact artifact frozen;
25. only then fresh Telegraph registration;
26. actual Telegraph acceptance and Stage-2 result recorded;
27. exact accepted artifact used for submission.

## Competitive interpretation

`15/15` is treated as a useful historical/diagnostic ordinal target, not a mathematical guarantee of #1. The hidden Stage-2 fixture set is independent from the local benchmark. The competitive objective is robust ranking of correct > partial > unrelated > contradictory answers across unseen answer styles.

The current team clarification that Stage-2 evaluation has a **10-minute hard module budget** is treated as a release-critical runtime constraint. Exact hidden scoring mechanics remain undisclosed.

## Three-track integration

`Track 1 evidence → Track 2 quality evaluation → Track 3 product value`

Track 1 remains the evidence source of truth. Track 2 evaluates answer fidelity and resistance to factual/semantic gaming. Track 3 presents the resulting intelligence through contract analysis, passport, evidence, history/monitoring and actionable workflows.

## Current critical path

`V10.1 allocator fix → fresh CI → tournament → contract suite → mutation → public hard.json → strict Wazero → SHA-256 → freeze → fresh registration → Telegraph acceptance → live Stage-2 result → exact submission`

**No green gate → no registration.**

## Honest completion state

As of 2026-08-30, Veridex is **not yet Track-2 accepted and not #1**. The engineering direction is selected; the remaining proof is runtime/CI/release validation followed by independent Telegraph evaluation.
