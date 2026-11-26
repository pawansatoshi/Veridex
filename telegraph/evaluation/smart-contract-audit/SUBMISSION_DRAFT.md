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

## 26 November 2026 readiness and reviewer handoff

This section supersedes the older live-route and CI snapshot above. The target for
question material is `SMART_CONTRACT_AUDIT_GENERAL` under Mission #202
(Web3 Native & DeFi), Evaluators track. The published family label is Hybrid.
The 26 November live reads confirmed the child is Judgment and the node
advertises family `SMART_CONTRACT_AUDIT` as the Judgment adapter registration
target. The active adapter is third-party registration #187. The pool reported
418 eligible rows from six contributors, with a live minimum of three. This
supersedes the earlier pool shortfall; the published guide still says five,
and the current pool exceeds both. A direct submitter lookup for
`0xb467F683764593316fAEbB0709127E90791Fe47F` returned zero rows. The public adapter kit HEAD remains
`1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`. Its compiled catalogue has neither
target, and the resolver refuses unknown targets.

Mission #202 and the [evaluation data guide](https://anjoman.ai/docs/scoring/contribute-evaluation-data)
document an independent question-material path. Use it after genuine adjudication
and confirmation of the canonical child and its pool endpoint. The local
packet preflight accepts preference pairs, ground truth and graded exemplars
with declared human provenance. The adapter-training quality thresholds are
separate. Local validation cannot authenticate an adjudication or establish eligibility.

1. Run `npm run test:audit-data` and `npm run verify:audit-live`. Inspect
   `artifacts/smart-contract-audit-live-evidence.json` for
   `decision.questionMaterialRouteObserved`. The live command can exit 1 when
   the Hybrid gate is blocked even if the question-material route is observed.
2. Use the [contributor checklist](CONTRIBUTOR_ONBOARDING.md) to record the
   primary source, audited revision, evidence and independent review for each
   row. Keep reviewed upload rows and private review records outside the
   public repository. The committed `pairs.jsonl` remains empty.
3. To validate and bind bytes locally, run
   `node scripts/prepare-audit-evalpool-submission.mjs /private/reviewed.jsonl <wallet-address> /private/unsigned.json`.
   The output contains the full dataset in base64. Treat it as the dataset
   itself. CI publishes readiness metadata only.
4. Have the contributor review the exact file and sign the upload in
   [Anjoman Evaluate](https://anjoman.ai/dashboard/eval). The official CLI path
   also supports an EIP-191 signature over the exact bytes; the unsigned
   packet is optional for the dashboard route. The upload requires no bond.
5. Check `GET /api/evalpool/submissions/mine?submitter=<wallet-address>&intent_id=SMART_CONTRACT_AUDIT_GENERAL`
   for row hashes and eligibility. Record timestamps, state counts and reason
   codes. An upload receipt and an eligible row are separate milestones.
6. Attach verified evidence, public progress links, the GitHub star username
   and a demo or equivalent walkthrough to the
   [official Season II form](https://hackathon.telegraphprotocol.com/).
   Deadline is 1 December 2026 at 23:59 UTC (2 December at 05:29 IST).

The SCVD fetch and pilot build were rerun on 26 November. The API returned
1,064 metadata candidates and the pilot builder selected 30 from 24 repositories.
Of those, 27 had a source commit and 11 had a file reference. These counts
record source metadata coverage and leave all 30 verdicts pending.

The reproducible walkthrough is steps 1–3 with the automated test fixture and
the empty-dataset failure. A final demo must also show the genuine upload and
eligibility evidence. This draft has no signed contribution or submission receipt.
