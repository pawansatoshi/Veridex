# Veridex — Telegraph Season II Evaluator submission draft

**Submission state: NOT READY FOR FINAL SUBMISSION**  
**Track:** Evaluators  
**Season II family label:** `SMART_CONTRACT_AUDIT`  
**Live canonical evaluation-pool Intent:** `SMART_CONTRACT_AUDIT_GENERAL`  
**Published class:** Hybrid  
**Live node scorer:** Judgment via generic fallback; maintainer clarification required  
**Network evidence:** Telegraph testnet, read-only diagnostics  
**Owner/contact:** Pawan Satoshi / GitHub `pawansatoshi`

## 1. Project summary

Veridex is an evidence-first smart-contract intelligence and evaluation project. Its evaluator contribution is designed to measure whether a security assessment is technically supported by the correct contract revision, source path, exploit preconditions, impact and uncertainty—rather than rewarding plausible-sounding but unsupported answers.

The target evaluation capability covers reentrancy, access control, arithmetic and related EVM security reasoning. It distinguishes confirmed, mitigated/historical, false-positive, incomplete and ambiguous findings. Missing evidence must produce an explicit inconclusive result rather than a false assurance that a contract is safe.

## 2. What works today

- A public SCVD metadata fetcher and curated 30-case review queue.
- A fail-closed local validator for official question row types and truth-source row structure.
- Unit tests for normalization, provenance handling, canonical Intent ID checks, truth-source shape and live evidence parsing.
- A read-only GitHub Actions workflow that records canonical Intent status, miner supply, scorer resolution and evaluation-pool state.
- A complete execution framework and reproducible documentation.

The latest live evidence workflow passed its 14 evaluator unit tests and captured the live protocol state. This is engineering evidence, not proof of an accepted evaluator contribution.

## 3. Telegraph integration evidence

Read-only testnet evidence from 16 November 2026:
- Canonical child Intent: `SMART_CONTRACT_AUDIT_GENERAL`.
- Canonical: true; 18 miners listed.
- Live scorer resolution: Judgment via `GENERIC` fallback; no dedicated SMART_CONTRACT_AUDIT scorer confirmed.
- Live Intent detail returns `request: null` and `response: null`.
- Evaluation pool: 302 eligible rows, 11 admitted, 71 quarantine, 2 rejected; 3 submitters, 2 eligible submitters; 5 required.
- The rows and submitters are existing third-party pool material, not Veridex uploads.

Evidence:
- Live workflow run: https://github.com/pawansatoshi/Veridex/actions/runs/43814704469
- Source repository: https://github.com/pawansatoshi/Veridex
- Draft PR: https://github.com/pawansatoshi/Veridex/pull/256
- Mission: https://github.com/telegraphprotocol/bounties/issues/202

## 4. Known blockers

1. Season II catalogue labels the family Hybrid, while the live node returns Judgment through generic fallback. The live detail has no request/response schema.
2. The public adapter kit compiled class catalogue does not include either `SMART_CONTRACT_AUDIT` or `SMART_CONTRACT_AUDIT_GENERAL`. Maintainer-confirmed class and build path are required.
3. The existing pool has only 2 eligible contributors, below the 5-contributor question-pool minimum.
4. The 30 SCVD pilot cases have not received independent human review. The local preference dataset is intentionally empty.
5. No Veridex evaluation data has been uploaded; no rows have been verified eligible.
6. No adapter has been trained, exported, packaged, hosted or registered.
7. The official H2 registration and final submission form have not been completed.

## 5. What a reviewer can reproduce now

1. Open the repository and read `telegraph/evaluation/smart-contract-audit/EXECUTION_FRAMEWORK.md`.
2. Run `npm run test:audit-data` and `node --test tests/smart-contract-audit-*.node-test.mjs`.
3. Run `npm run verify:audit-live` to capture current read-only testnet evidence.
4. Inspect the JSON evidence artifact and compare the catalogue, live scorer and pool states.
5. Confirm that the validator fails closed and does not report pool readiness for empty or unreviewed data.

## 6. Work required before this becomes a qualifying final entry

- [ ] Register for Season II on the official H2 website and select Evaluators.
- [ ] Obtain maintainer confirmation of the canonical family, live class, and supported adapter-kit revision.
- [ ] Obtain a request/response schema if Hybrid truth-source material is required.
- [ ] Recruit at least three more eligible independent contributors for the existing pool, and complete independent review of Veridex's own cases.
- [ ] Build official-format evaluation material only from adjudicated evidence.
- [ ] Run the official adapter-kit data checks and held-out tests.
- [ ] Upload only after the account holder authorizes the exact signed payload; verify every row's state and active snapshot.
- [ ] Train/package/register an adapter only if the confirmed live scorer requires one.
- [ ] Provide an independently reproducible evaluator result or demonstrated measurement improvement.
- [ ] Record a 2–5 minute demo or accessible equivalent.
- [ ] Publish at least three meaningful updates on separate dates and collect genuine external developer feedback.
- [ ] Star the Telegraph Bounties repository (mandatory entry requirement) and record the GitHub username.
- [ ] Submit through the official H2 website by 1 December 2026, 23:59 UTC.

## 7. Final submission statement (use only after blockers are cleared)

Veridex contributes an evidence-first evaluator for `SMART_CONTRACT_AUDIT_GENERAL`, designed to assess smart-contract security reasoning against commit-pinned primary evidence and balanced adjudicated cases. The entry includes reproducible validation, protocol integration evidence, held-out tests, and transparent limitations. All claims about live scoring, data eligibility and adapter status will be backed by the corresponding official node evidence.

Do not submit this statement as a completed-work claim until each applicable checklist item above is verified.
