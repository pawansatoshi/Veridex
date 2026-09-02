# Veridex — Persistent Project State

**Repository:** `pawansatoshi/Veridex`  
**Branch:** `main`  
**State reviewed:** 2 Sep 2026  
**Current phase:** TELEGRAPH TRACK 3 APPLICATION HARDENING / RELEASE VERIFICATION

## Current reality

The deterministic EVM analysis core, proxy-aware composition, Capability Passport, Continuous Watch domain layer, evaluation harness, production Miner endpoint, Telegraph YAML/registration, dedicated product surfaces, progressive Evidence Explorer, spatial evidence visualization, and Telegraph Track 1/2/3 presentation surfaces are implemented.

Track 3 now has a production application path at `/telegraph/application/` with a dedicated `POST /track3` orchestration endpoint. The endpoint combines the existing deterministic analysis with a server-side Telegraph Engine/x402 secondary intelligence request, normalizes the response, preserves conflict/inconclusive states and returns a versioned machine-readable result.

## Track 3 implementation status

**Status: IMPLEMENTED / CI-HARDENED / EXTERNAL PAYMENT CONFIGURATION PENDING.**

Implemented:

- `src/telegraph/client.ts` — server-side Telegraph `/v1/ask` client with x402 retry path, network allowlist, per-request payment cap and timeout.
- `src/application/track3.ts` — deterministic + Telegraph orchestration, bounded review parsing, provenance, conflict handling and explicit decision states.
- `api/track3.ts` — POST-only public endpoint, origin guard, lightweight per-IP rate limiting and secret-safe structured logs.
- `telegraph/application/index.html` — production UI with live workflow, Telegraph provenance/payment state, evidence separation and machine-result copy action.
- `tests/unit/track3.test.ts` — parser, conflict and failure-semantics regression coverage.
- `vercel.json` — `/track3` route.
- `.github/workflows/ci.yml` — explicit Track 3 regression gate alongside existing H1/Phase 02/03/04 gates.
- `docs/TRACK-3-APPLICATION.md` — application contract and production boundaries.
- `docs/TRACK-3-RUNBOOK.md` — release, x402, smoke-test, troubleshooting and rollback procedure.

## Release verification incident and fix

The first Track 3 CI run on commit `617b268132ad2610f4587655c4bfa94fd0e44cfd` exposed two pre-release issues:

1. strict TypeScript `exactOptionalPropertyTypes` failures in the new Telegraph client/orchestration code;
2. an existing Phase 05D regression: `tests/ui/phase05d.test.ts` expected `/assets/veridex-spatial.css`, but `evidence/index.html` did not link the stylesheet even though the spatial controller and stylesheet existed.

Both were fixed in subsequent commits. The CI logs showed the Track 3 regression suite itself passing `7/7` tests before the overall gate failed on the unrelated Phase 05D UI test. The Phase 05D page integration was restored by adding the shared spatial stylesheet link rather than weakening the regression test.

## Current CI evidence

For commit `617b268...`, GitHub Actions verified successfully before the final enforcement step:

- dependency install
- npm audit: 0 vulnerabilities
- Track 3 tests: 7/7 passed
- proxy tests: passed
- Passport tests: passed
- Watch tests: passed
- live Miner health: passed
- Telegraph YAML validation: passed
- live Telegraph integration verification: passed
- resilience recovery: passed
- real-chain ground truth: 3/3 cases, 12/12 observations, accuracy 1.0
- deterministic quality evaluation: passed, quality score 1.0
- production benchmark: completed
- production schema: completed

The final enforcement step failed only because the full unit suite caught the Phase 05D stylesheet-link regression plus the earlier strict typecheck/build failures. A new CI run is required after the fixes; repository state must not be called GREEN until that run finishes successfully.

## Telegraph configuration boundary

Production Track 3 needs a currently verified, externally reachable Telegraph Engine base URL and a server-side EVM burner key when x402 payment is required.

Required Vercel production variables:

- `TELEGRAPH_ENGINE_URL`
- `TELEGRAPH_EVM_PRIVATE_KEY`
- optional safety/config variables documented in `docs/TRACK-3-RUNBOOK.md`

Do not commit or expose the private key. The current Telegraph docs distinguish node public API port `7044` from the Engine subprocess port `8080`; a Vercel serverless function must use an externally reachable Engine route, not an internal-only service address. citeturn618968search0turn618968search1turn618968search2

## Track 1 status

- Miner ID: `1001`
- Slug: `veridex-contract-risk-miner`
- Registration: `#144`
- Intent historically registered: `FRAUD_DETECTION`
- Network: Base Sepolia
- Production endpoint: `https://veridex-ecru.vercel.app`

Fresh registry status must still be checked before making a current official-status claim.

## Track 2 status

Track 2 remains independent of Track 3. The hidden-score experiments and repeated weak hidden results are not used as a dependency for the application.

- replacement scorer is locally built/verified;
- previous registrations that failed hidden/structural acceptance remain rejected;
- no Track 3 code imports the Track 2 WASM/scorer.

## Track 3 adoption plan

The application is designed for genuine adoption evidence:

1. share the public production URL in the Telegraph community and on X;
2. have real users run meaningful contract reviews;
3. preserve result screenshots/request IDs and payment proof where appropriate;
4. demonstrate an end-to-end decision flow rather than meaningless request volume.

Do not manufacture users, traffic, transactions, rankings or performance claims.

## H1 / Track 3 operating rule

Track 3 is judged on useful production demand and application quality. The app must remain live and make real Telegraph requests where advertised. A provider outage must remain an explicit unavailable/inconclusive state, never a negative security result.

## Next milestones

1. finish the first post-fix all-gates CI run and require GREEN;
2. confirm the latest Vercel production deployment is `READY` and serves the updated Track 3 UI;
3. verify the live `TELEGRAPH_ENGINE_URL` from the current Telegraph environment before production paid smoke testing;
4. configure a small-funded burner key in Vercel Production only;
5. run one paid real-user-style smoke test and capture provider/intent/payment/result evidence;
6. begin genuine community onboarding and adoption capture;
7. only then consider optional Track 3 stretch work such as multi-intent modes, richer reports, MCP/agent wrappers or durable watch infrastructure.

## Evidence policy

Repository presence is not runtime proof. Never claim official Telegraph ranking, fabricated traffic/demand, current-commit CI GREEN, successful x402 settlement, or current registry alignment without fresh evidence.
