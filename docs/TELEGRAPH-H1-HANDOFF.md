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

The following points were answered by Telegraph team members in the hackathon Discord and are treated as the current protocol guidance for this project:

### Registration timing

Ahmed Ali confirmed registration can be submitted anytime; it does not require waiting for a particular day. The project can register when ready.

### Base URL

`base_url` must be the actual **production API endpoint Telegraph will route requests to**, not the Veridex website. Example given by the team: `https://api.yourminer.com/v1/endpoint`.

The website/docs URL belongs in the optional `docs.website` field.

For Veridex, use the real deployed Miner endpoint once the exact request path is confirmed. Do not substitute the landing-page URL.

### Authentication

If the production API is publicly accessible without credentials, the YAML auth type should be `none`. This means Telegraph does not inject auth headers/query parameters.

Do not claim `none` until the actual production endpoint has been verified as public and functional.

### Endpoints

The YAML `endpoints` section must describe the **real production endpoints**: exact paths, HTTP methods and parameter mappings Telegraph will use. Representative request/response examples may be included in descriptions or structured parameter blocks.

### On-chain layout

The `on_chain` YAML block is optional. It is only required if the integration maps API response values to on-chain storage. A pure inference service can omit the YAML `on_chain` layout.

The team clarified that a floor price is still set through the on-chain registration transaction; that does not make the YAML `on_chain` block mandatory.

### Intent ↔ WASM mapping

The team confirmed WASM scorers are **per Intent**. Ahmed Ali also said the contract-side Intent mapping was being fixed and that miners should not wait for that fix: deploy/register the WASM and re-register later once the binding is fixed.

A later team response said the `breakdown_answer` requirement was deprecated/removed and only `rank_answer` is required for the updated scoring-module interface.

This Track 2 information must not be incorrectly applied to Track 1 Miner YAML.

## 4. Hackathon timing confirmed in official email/Discord

- Track 1 — Miners: starts 17 Aug, closes 31 Aug.
- Track 2 — Evaluation Scripts: starts 17 Aug, closes 31 Aug.
- Track 3 — Applications: 31 Aug–7 Sep.
- Final winner/announcement window was communicated as approximately 19–25 Sep.
- Ahmed Ali clarified that 17 Aug is the date builders can start; submissions happen at the end of the relevant track.

Therefore:

**Do not fill or submit the Miner registration form prematurely just because the form is visible.** Registration is allowed anytime, but our engineering gate is stricter: complete and verify the integration first, then register with production-ready values.

## 5. Form screenshots — what the current integration UI contains

The Connect API form exposes:

- canonical Intent selector/search
- custom Intent input
- On-Chain Layout toggle
- Advanced section
- limitations
- input schema
- output schema
- YAML preview
- upload to IPFS step
- subsequent registration/on-chain flow

The canonical Intent list visible in the UI includes examples such as:

`STORM_ALERT`, `DEEPFAKE_DETECTION`, `IMAGE_VERIFICATION`, `VIDEO_VERIFICATION`, `MEDIA_AUTHENTICITY_CHECK`, `AI_DETECTION`, `FACE_DETECTION`, `IMAGE_ANALYSIS`, `BIOMETRIC_VERIFICATION`, `IMAGE_TO_TEXT`, `DOCUMENT_OCR`, `RECEIPT_PARSING`, `REAL_TIME_ANSWER`, `RESEARCH_QUERY`, `CONTENT_EXTRACTION`, `IP_REPUTATION`, `DOMAIN_REPUTATION`, `FILE_REPUTATION`, `URL_SCAN`, `MALWARE_DETECTION`, `PHISHING_DETECTION`, `THREAT_INTELLIGENCE`, `IP_GEOLOCATION`, `FRAUD_DETECTION`, `VPN_PROXY_DETECTION`, `CURRENCY_EXCHANGE`, `CRYPTO_PRICE`, `FINANCIAL_DATA`, `SPEECH_TO_TEXT`, `AUDIO_TRANSCRIPTION`, `NETWORK_SCAN`, `BREACH_DETECTION`, `IDENTITY_VERIFICATION`, `EMAIL_REPUTATION`, `VULNERABILITY_CHECK`, `SSL_VERIFICATION`, `SECURITY_SCAN`, `INDICATOR_LOOKUP`, `SENTIMENT_ANALYSIS`, `LANGUAGE_TRANSLATION`, `DATA_ANALYSIS`, and `TABULAR_INFERENCE`.

**Important:** availability of an Intent in the UI does not mean it is semantically correct for Veridex. Never select an unrelated Intent simply to get the form through.

## 6. H1 work order before registration

The current user instruction is explicit:

> Complete items 2–6 first, find bugs and resolve them too; when everything is ready, then stop.

The working interpretation is:

### 2 — Telegraph integration contract

- verify the official request/response contract
- identify the legitimate Intent/category
- confirm whether Connect API expects `/detect`, `/analyze`, or a dedicated Miner endpoint
- confirm exact input/output schema
- confirm auth behavior
- confirm rate/timeout expectations if officially documented
- preserve adapter/domain separation

### 3 — Production Miner endpoint

- production URL is reachable
- exact HTTP method/path is correct
- request validation is deterministic
- response is stable machine-readable JSON
- errors are correctly classified
- no website URL is used as `base_url`
- no secrets are exposed

### 4 — YAML/configuration

- exact Intent mapping verified
- base_url points to production API
- auth is correct
- endpoint definitions match reality
- input schema matches API
- output schema matches API
- limitations describe real constraints
- optional on-chain layout remains OFF unless genuinely required
- YAML preview is internally consistent

### 5 — Registration/infrastructure readiness

- IPFS upload succeeds
- resulting configuration is reproducible
- on-chain registration prerequisites are understood
- floor price/payment fields are handled only according to official docs/UI
- wallet/network/transaction details are verified before signing
- never expose private keys or seed phrases

### 6 — End-to-end verification

- register only after the above is ready
- send a real request through Telegraph if the official flow permits
- verify response against the Veridex API directly
- verify Miner routing, latency and failure behavior
- capture evidence for submission
- fix every discovered bug and rerun tests

## 7. Current Veridex implementation state

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

## 8. Latest deployment/bug-fix checkpoint

Latest relevant commit:

`7c368c134e9ee7aee1167a8fd863dd80a8085b96`

Commit message:

`fix: restore TypeScript narrowing in proxy resolver`

The Vercel production deployment associated with this commit was observed as READY. `/health` returned:

```json
{"ok":true,"service":"veridex-miner","version":"0.1.0"}
```

A recent Vercel runtime-error check reported no runtime errors in the selected 30-minute window.

Production surface currently documented as:

- `https://veridex-ecru.vercel.app/`
- `POST /detect`
- `POST /analyze`
- `GET /health`
- `GET /metrics`

A new agent must re-verify the live deployment before claiming it is still healthy.

## 9. Address-first contract

```text
Any address
  → detect family
  → EVM wallet? explain and stop contract analysis
  → EVM contract? analyze
  → known non-EVM format? identify family and stop unsupported semantic analysis
  → unknown/ambiguous? do not guess
```

Format recognition is a safety/usability gate, not proof of full semantic analysis for every chain.

## 10. Evidence contract

Evidence hierarchy:

```text
Tier 1 — verified ABI / verified source
Tier 2 — supported verified structural evidence
Tier 3 — instruction-boundary bytecode fallback
```

Every result should preserve requested address, contract/code address, chain, capability, evidence, detection method/tier, verification state, confidence, conclusive/inconclusive state, fallback reason, provider/API status and relevant observation metadata.

Provider failure must never become a negative contract finding.

## 11. Security/correctness gates

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

## 12. Post-H1 roadmap — do not block Track 1

### Phase 2 — Proxy-Aware Composition
Broader proxy families, implementation history, beacon composition and richer provenance.

### Phase 3 — Capability Passport
Canonical evolving identity and evidence-backed capability posture.

### Phase 4 — Continuous Watch
Persistent observations, adaptive polling and safe change detection.

### Phase 5 — Capability Change Intelligence / Time Machine
Historical snapshots, capability diffs and explanations.

### Phase 6 — Policy Engine
`COMPLIANT / VIOLATION / INCONCLUSIVE` policy outcomes.

### Phase 7 — Alerts
Observation → Diff → Policy → Alert → Notification Router.

### Phase 8 — Wallet Safety
Approvals, allowances, spender intelligence and transaction-risk signals.

### Phase 9 — Multi-Chain Semantic Intelligence
Dedicated semantic analyzers beyond address-format recognition.

### Phase 10 — Product Application
Evidence-first web product, localization, accessibility, PWA and account/product surfaces.

### Phase 11 — 3D Contract Core
Blockchain → Contract → Evidence → Intelligence → Change visualization.

### Phase 12 — Agents / SDK / MCP / Enterprise
Agent APIs, SDK/MCP and enterprise tooling.

### Phase 13 — Native Mobile
Native applications and mobile-specific controls.

## 13. Five product pillars

1. **UNDERSTAND** — what is this contract/address?
2. **VERIFY** — why should I believe the result?
3. **DISCOVER POWERS** — what can it do?
4. **WATCH** — what changes after I leave?
5. **CONNECT** — can humans, apps, agents and Telegraph consume the intelligence?

H1 prioritizes Understand + Verify + Discover Powers + Connect. Watch becomes the persistent post-H1 layer.

## 14. Non-negotiable rules for the next chat

- Read `AGENTS.md`, `PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md` and this file first.
- Inspect the actual repository before changing code.
- Official Telegraph docs/rules/Discord team answers outrank assumptions.
- Never invent an Intent.
- Never use an unrelated Intent for convenience.
- Never claim production readiness from documentation alone.
- Never treat selector presence as semantic proof.
- Never convert RPC/provider failure into a negative finding.
- Every bug gets a regression test.
- Run tests/typecheck/build and verify the live deployment after material changes.
- Keep Track 1 Miner correctness ahead of Track 2 and post-H1 features.
- Do not fabricate traffic, users, rankings, demand or performance.
- Do not expose secrets.

## 15. Immediate next action

**Do not fill the final registration form until items 2–6 above have been completed and verified.**

First establish the exact official Telegraph contract for Veridex's Connect API path and legitimate Intent mapping. Then make the YAML, IPFS and registration values match the real production API exactly. Finally perform an end-to-end live verification and record the evidence.
