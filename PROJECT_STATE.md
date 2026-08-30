# Veridex — Persistent Project State

**Repository:** `pawansatoshi/Veridex`  
**Branch under active hardening:** `track2-v10-hardening`  
**State reviewed:** 30 Aug 2026  
**Current phase:** H1 OPERATIONAL / TELEGRAPH TRACK 2 HARDENING

## Current reality

The deterministic EVM analysis core, proxy-aware composition, Capability Passport domain layer, Continuous Watch domain layer, evaluation harness, production Miner endpoint, Telegraph YAML/registration, dedicated product surfaces, progressive Evidence Explorer, evidence-backed spatial visualization and Telegraph Track 1/2/3 presentation surfaces are implemented.

Track 1 Miner registration is live as documented below. Track 2 remains the competitive bottleneck and is not yet accepted or proven #1.

## Historical Track 2 failures

Historical registration/evaluation evidence remains immutable reference material:

- `#1809`: structural failure involving non-zero whitespace-only scoring.
- `#1818`: behavioral ordering loss, approximately 14/15 against incumbent.
- `#1821`: behavioral ordering loss, approximately 14/15 against incumbent.

An older repository state also records registration `#1766` rejected at structural validation because self-match did not beat an unrelated cross-match. Do not reuse or represent that candidate as accepted.

## Track 2 V10.1 hardening

The active candidate is built by `telegraph/evaluation/neural/build_candidate.py` from pinned MIT-licensed Telegraph baseline commit:

`dfa0cf7fda72789267811ba2190f61a8eaacedf6`

Veridex's wrapper adds:

- exact/normalized matching;
- exact empty/whitespace hard zero behavior;
- contradiction/polarity/direction guards;
- named-entity conflict protection using question + ground truth;
- numeric mismatch protection;
- numeric question-context answer-shape protection;
- unambiguous binary polarity protection;
- bounded monotonic calibration;
- one authoritative scoring path shared by `rank_answer` and `breakdown_answer`.

The five-f32 breakdown contract is:

`[base_semantic, factual_guard, question_guard, calibrated, final]`

where slot 4 equals the authoritative final rank score.

### V10.1 evidence already observed

CI run `33294197111` built a **24,192,001-byte** WASM with **0 imports**, passed WASM validation, and passed the hard edge/determinism preflight with **0 primary-benchmark inversions** across 49 current cases / 55 high-vs-low pairs.

Observed preflight metrics:

- mean margin: `0.4689717406216501`
- worst margin: `0.00018387287855148315`
- self-match: `1`
- score standard deviation: `0.342690178381962`

The same run exposed a JavaScript tournament harness bug (`WebAssembly.instantiate(Module, {})` returns an Instance directly). That bug has been fixed. A fresh Track 2 run is required to validate the corrected tournament, supplemental contract-security suite, public blind-spot suite, mutation suite and Wazero checker.

### Benchmark discrepancy

The file `telegraph/evaluation/track2-benchmark-v2.json` currently contains **49 cases**, despite older project context referring to 50. The source file is authoritative. A six-case supplemental `track2-benchmark-contract-v1.json` now covers contract-security authority, evidence, overclaim, and entity-conflict reasoning under the same `FRAUD_DETECTION` intent.

## Track 1

- Miner ID: `1001`
- Slug: `veridex-contract-risk-miner`
- Registration: `#144`
- Intent: `FRAUD_DETECTION`
- Network: Base Sepolia
- Production endpoint: `https://veridex-ecru.vercel.app`

Track 1 remains preserved. Its evidence-first architecture, proxy-aware composition, authority analysis, verification evidence and failure semantics are not being replaced by Track 2 work.

## Track 3

Track 3 application surfaces remain implemented under `/telegraph/application/` and related product routes. The product thesis remains:

`contract → capability intelligence → evidence → authority → risk/confidence → history/monitoring → actionable insight`

Durable WatchStore/scheduler work remains intentionally distinct from the already implemented presentation/browser-local watch surface.

## Current Track 2 registration status

- Previous registrations: preserve historical records; do not reuse rejected bytes.
- Current V10.1 candidate: **NOT REGISTERED**.
- Current exact SHA-256: **PENDING GREEN CI**.
- Telegraph acceptance: **NOT PROVEN**.
- Live competitive placement: **NOT PROVEN**.
- #1 claim: **NOT MADE**.

## CI/CD status

The active release lane is `.github/workflows/track2-final-verify.yml`.

Two obsolete Track 2 auto-publishing workflows were converted to manual-only historical reference workflows with read-only permissions:

- `.github/workflows/build-track2-final.yml`
- `.github/workflows/build-track2-wasm.yml`

The active workflow now:

`build → structural → preflight → primary tournament → contract-security suite → public hard.json blind-spot gate → mutation suite → public Wazero checker → SHA-256 → artifact upload`

No automatic registration or source write-back is performed.

## Current blocking gate

The next green release requires the current Track 2 workflow to pass all of the following on the exact source commit:

- structural validation
- required exports
- zero imports
- empty/whitespace/empty-ground-truth hard zeros
- exact match
- long input >65,535 bytes
- Unicode/CJK/emoji/accented input
- embedded NUL
- repeated and fresh-instance determinism
- primary tournament with zero inversions
- supplemental contract-security tournament with zero inversions
- public `hard.json` blind-spot gate
- mutation suite
- public Wazero compatibility checker
- exact SHA-256 artifact record

**No green gate → no registration.**

## Evidence policy

Repository presence is not runtime proof. Never claim official Telegraph ranking, fabricated traffic/demand, fabricated benchmark numbers, current-commit CI GREEN, live registry alignment, or #1 placement without fresh evidence.

Status labels must remain distinct:

**IMPLEMENTED LOCALLY → VALIDATED LOCALLY → CI VALIDATED → PUBLIC CHECKER PASSED → REGISTERED → ACCEPTED BY TELEGRAPH → COMPETITIVE ON LIVE EVALUATION → OFFICIALLY SUBMITTED.**
