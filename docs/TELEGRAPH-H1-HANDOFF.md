# Veridex — Telegraph H1 Complete Handoff

> Continuity document for a new chat/agent. Read this before changing code or filling the Telegraph registration form.

**Last reviewed:** 15 Aug 2026  
**Repository:** `pawansatoshi/Veridex`  
**Branch:** `main`  
**H1 window:** Track 1/2: 17–31 Aug 2026; Track 3: 31 Aug–7 Sep 2026

## 1. Mission

Build **Veridex — Verifiable On-Chain Intelligence** into a winning Telegraph Miner and a durable evidence-first smart-contract capability intelligence product.

Core promise:

> Know what a smart contract can do — and know when its powers change.

Trust rule:

> No evidence → no certainty.

The H1 wedge is intentionally narrow and reliable:

1. ownership/control
2. upgradeability/proxy surface
3. pause capability/state
4. mint capability/authority where evidence permits

Do not expand this capability matrix until these four are reliable in production.

## 2. Telegraph model — important correction

A Telegraph Miner is an API/model/dataset/tool wrapped for the Telegraph network. Veridex therefore has two layers:

```text
Veridex deterministic intelligence core
            ↑
Telegraph Miner adapter / API contract
            ↑
Telegraph protocol envelope
```

Do **not** redesign the Veridex engine around a guessed Telegraph Intent. The adapter is the integration boundary.

## 3. Official information confirmed by Telegraph team in Discord

The following points were answered by Telegraph team members in the hackathon Discord and are treated as the current protocol guidance for this project.

### Registration timing

Ahmed Ali confirmed registration can be submitted anytime; it does not require waiting for a particular day. The project can register when ready.

### Base URL

`base_url` must be the actual **production API endpoint Telegraph will route requests to**, not the Veridex website. Example given by the team: `https://api.yourminer.com/v1/endpoint`.

The website/docs URL belongs in the optional `docs.website` field.

For Veridex, use the real deployed Miner endpoint once the exact request path is confirmed. Do not substitute the landing-page URL.

### Authentication

If the production API is publicly accessible without credentials, the YAML auth type should be `none`. This means Telegraph does not inject auth headers/query parameters.

### Endpoints

The YAML `endpoints` section must describe the **real production endpoints**: exact paths, HTTP methods and parameter mappings Telegraph will use. Representative request/response examples may be included in descriptions or structured parameter blocks.

### On-chain layout

The `on_chain` YAML block is optional. It is only required if the integration maps API response values to on-chain storage. A pure inference service can omit the YAML `on_chain` layout.

The team clarified that a floor price is still set through the on-chain registration transaction; that does not make the YAML `on_chain` block mandatory.

### Intent ↔ WASM mapping

The team confirmed WASM scorers are **per Intent**. Ahmed Ali also said the contract-side Intent mapping was being fixed and that miners should not wait for that fix: deploy/register the WASM and re-register later once the binding is fixed.

A later team response said the `breakdown_answer` requirement was deprecated/removed and only `rank_answer` is required for the updated scoring-module interface.

This Track 2 information must not be incorrectly applied to Track 1 Miner YAML.

## 4. Veridex Intent mapping — CONFIRMED

On 15 Aug 2026, Ahmed Ali explicitly confirmed that `FRAUD_DETECTION` is a legitimate high-value use case for Veridex. His confirmation specifically described parsing contract state and logic such as ownership, mint/pause authority, and upgradeability to output verifiable risk/safety signals that agents can rely on.

Therefore the Track 1 Miner mapping is:

```yaml
supported_intents:
  - FRAUD_DETECTION
```

This is an explicit protocol-team semantic confirmation, not a guessed or convenience mapping.

Ahmed also confirmed that a single Miner endpoint may subscribe to multiple Intents. Veridex will not add `AGENT_TASK` merely because dual-intent registration is technically supported; the current Track 1 integration remains intentionally narrow and uses only `FRAUD_DETECTION`.

## 5. Hackathon timing confirmed in official email/Discord

- Track 1 — Miners: starts 17 Aug, closes 31 Aug.
- Track 2 — Evaluation Scripts: starts 17 Aug, closes 31 Aug.
- Track 3 — Applications: 31 Aug–7 Sep.
- Final winner/announcement window was communicated as approximately 19–25 Sep.
- Ahmed Ali clarified that 17 Aug is the date builders can start; submissions happen at the end of the relevant track.

Registration is allowed anytime, but the engineering gate remains stricter: complete and verify the integration first, then register with production-ready values.

## 6. Current exact Veridex Miner contract

Production base URL:

```text
https://veridex-ecru.vercel.app
```

Telegraph-facing endpoint:

```text
POST /analyze
```

Authentication:

```text
none
```

Request:

```json
{
  "chain": "1",
  "contractAddress": "0x...",
  "codeAddress": "0x..."
}
```

`codeAddress` is optional. `chain` accepts `1`, `ethereum`, and `ethereum-mainnet`, and responses normalize the chain to canonical `1`. Other chains are rejected because H1 semantic analysis is Ethereum-mainnet only.

Success envelope:

```json
{
  "schema": "veridex.miner.v1",
  "result": {
    "contract": {},
    "proxy": {},
    "verification": {},
    "capabilities": [],
    "evidence": [],
    "confidence": 0,
    "conclusive": false,
    "providerStatus": {}
  },
  "capabilityIntelligence": {
    "subject": {},
    "capabilityMap": [],
    "evidenceGraph": [],
    "state": "established",
    "confidence": 0
  }
}
```

## 7. Miner YAML

The repository now contains `telegraph/miner.yaml` with the confirmed `FRAUD_DETECTION` mapping, public `none` authentication, `/analyze` POST endpoint, input schema, output schema and real H1 limitations.

The YAML intentionally omits `on_chain` because this is an API-only inference Miner and the on-chain layout is optional.

The YAML has been syntax-parsed successfully. Final validation must still be performed by the official Telegraph integration wizard/import validator because that is the authoritative schema validator for the registration format.

## 8. H1 work order before registration

### 2 — Telegraph integration contract

- [x] legitimate Intent confirmed: `FRAUD_DETECTION`
- [x] exact production path identified: `/analyze`
- [x] public auth behavior verified
- [x] input/output contract documented
- [ ] official Telegraph YAML/import validation

### 3 — Production Miner endpoint

- [x] production URL reachable
- [x] exact HTTP method/path verified
- [x] deterministic request validation
- [x] stable machine-readable response envelope
- [x] no website URL used as `base_url`
- [x] no secrets exposed

### 4 — YAML/configuration

- [x] exact Intent mapping verified by Telegraph team
- [x] base_url points to production API
- [x] auth is `none`
- [x] endpoint definition matches production
- [x] input schema matches API contract
- [x] output schema matches API contract
- [x] real limitations documented
- [x] optional on-chain layout omitted
- [ ] official Telegraph import/sandbox validation

### 5 — Registration/infrastructure readiness

- [ ] IPFS pin through official integration UI
- [ ] on-chain registration prerequisites verified
- [ ] floor price/payment fields handled according to official UI/docs
- [ ] wallet/network/transaction details verified before signing
- [x] no private keys or seed phrases required by the Miner itself

### 6 — End-to-end verification

- [ ] real Telegraph-routed request
- [ ] response compared against direct Veridex API response
- [ ] Miner routing/latency/failure evidence captured
- [ ] submission evidence package complete

## 9. Current Veridex implementation state

Implemented/foundation work already exists on `main`, including:

- strict EVM validation
- multi-chain address-format detection
- EVM wallet-vs-contract gate using `eth_getCode`
- non-EVM safe-stop behavior
- `/detect`, `/analyze`, `/health`, `/metrics`
- evidence-first architecture
- bounded EVM instruction walking
- selector-collision protection
- malformed/truncated bytecode regression coverage
- RPC timeout/retry/circuit breaker/failure classification
- JSON-RPC revert vs infrastructure failure classification
- verification abstraction/Sourcify provider
- EIP-1967 and legacy proxy handling
- ownership, pause and mint capability foundations
- normalized Miner result
- deterministic Capability Diff primitive
- ground-truth evaluator foundation
- p50/p95/p99 instrumentation
- bounded concurrency
- production analysis cache and request coalescing
- CI dependency audit gate
- public Ethereum RPC fallback
- benchmark harness
- real Ethereum mainnet ground-truth harness
- failure-injection/recovery tests
- H1 owner runbook
- standalone Miner/production response-envelope parity
- production response-schema verification script
- `telegraph/miner.yaml` candidate registration manifest

## 10. Latest production checkpoint

The current production deployment has been observed serving successful `/health`, `/metrics`, and POST `/analyze` requests with HTTP 200. A GET request to `/analyze` correctly returns 405 because the Miner endpoint is POST-only.

The latest Vercel build completed successfully for commit `31b2c7585b8d1afc1f6cc4881bfb1064ff607419` before subsequent documentation/YAML commits encountered the Vercel build-rate-limit status. Do not claim the newest commits are production-deployed until Vercel accepts a new build.

## 11. Address-first contract

```text
Any address
  → detect family
  → EVM wallet? explain and stop contract analysis
  → EVM contract? analyze
  → known non-EVM format? identify family and stop unsupported semantic analysis
  → unknown/ambiguous? do not guess
```

Format recognition is a safety/usability gate, not proof of full semantic analysis for every chain.

## 12. Evidence contract

Evidence hierarchy:

```text
Tier 1 — verified ABI / verified source
Tier 2 — supported verified structural evidence
Tier 3 — instruction-boundary bytecode fallback
```

Every result should preserve requested address, contract/code address, chain, capability, evidence, detection method/tier, verification state, confidence, conclusive/inconclusive state, fallback reason, provider/API status and relevant observation metadata.

Provider failure must never become a negative contract finding.

## 13. Security/correctness gates

Required before calling H1 complete:

- strict address and bytecode validation
- bounded parser work
- EVM instruction-boundary scanning
- selector-collision protection
- malformed ABI/bytecode handling
- RPC timeout/retry/circuit breaker
- expected application-level revert classification
- infrastructure failure classification
- no client-supplied evidence treated as canonical
- no secrets in client code
- dependency/CI security gates
- regression test for every correctness bug

## 14. Non-negotiable rules for the next chat

- Read `AGENTS.md`, `PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` and this file first.
- Inspect the actual repository before changing code.
- Official Telegraph docs/rules/Discord team answers outrank assumptions.
- `FRAUD_DETECTION` is now confirmed as the legitimate Veridex Intent.
- Never add an unrelated Intent for convenience.
- Never claim production readiness from documentation alone.
- Never treat selector presence as semantic proof.
- Never convert RPC/provider failure into a negative finding.
- Every bug gets a regression test.
- Run tests/typecheck/build and verify the live deployment after material changes.
- Keep Track 1 Miner correctness ahead of Track 2 and post-H1 features.
- Do not fabricate traffic, users, rankings, demand or performance.
- Do not expose secrets.

## 15. Immediate next action

**Use the confirmed `FRAUD_DETECTION` mapping to validate/import `telegraph/miner.yaml` through the official Telegraph integration validator, then complete IPFS/registration prerequisites and a real Telegraph-routed request before declaring Track 1 complete.**
