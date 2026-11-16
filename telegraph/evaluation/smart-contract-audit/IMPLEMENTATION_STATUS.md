# SMART_CONTRACT_AUDIT evaluator — implementation status
**Last reconciled: 16 November 2026**

## Current scope and official destination

- Current Season II catalogue candidate: `SMART_CONTRACT_AUDIT`, listed as **Hybrid**. The live node's canonical flag, miner count, request schema and resolved scorer remain unverified; do not use the old `SMART_CONTRACT_AUDIT_GENERAL` assumption unless the live node confirms it.
- Telegraph bounty issue [#128](https://github.com/telegraphprotocol/bounties/issues/128) is **closed** with reason `not_planned` (15 November 2026). The maintainer says work continues inside the Season II missions it serves: [#189 Exchange](https://github.com/telegraphprotocol/bounties/issues/189) and [#202 Web3 Native & DeFi](https://github.com/telegraphprotocol/bounties/issues/202).
- Mission #202 explicitly includes an Evaluators contribution route for SMART_CONTRACT_AUDIT. Mission work is non-exclusive; GitHub claim/progress comments coordinate participation, while the official Anjoman submission path is separate.
- Issue #128 retains the `reward:unfunded` label and explicitly says there is no standalone GitHub payout. Season II prizes and protocol earnings are separate and eligibility-dependent.
- No `/claim` has been posted by `pawansatoshi` on #128, #189 or #202 as of this reconciliation. No claim/progress clock is active. Do not post one without the user's explicit decision.

## Current published evaluator requirements

- Historical issue #128 and the live node describe `SMART_CONTRACT_AUDIT_GENERAL` as Judgment; the current Season II catalogue labels family `SMART_CONTRACT_AUDIT` Hybrid. Live node: canonical child true, 18 miners, scorer `judgment`, `served_by: GENERIC`, `generic_fallback: true`, request/response null. Do not build against this discrepancy until maintainers clarify the intended class.
- Current adapter documentation specifies a safetensors LoRA delta for the shared ModernBERT Foundation Model (`abi=lora-v1`, `format_version=1`). Full-model WASM is a legacy format.
- Mission #202 says evaluator work must follow the selected Intent's actual node class, family and scoring path. It asks for sourced, balanced better/worse examples and a compatible adapter **where needed**; do not assume a new adapter is always required.
- The exact child scorer and family scorer both resolve to Judgment via generic fallback. There is no dedicated SMART_CONTRACT_AUDIT scorer confirmed.
- The pinned adapter-kit commit in `baseline.lock` is `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`. Its compiled class catalogue contains neither `SMART_CONTRACT_AUDIT` nor `SMART_CONTRACT_AUDIT_GENERAL`; offline `ResolveClass` refuses the target. Do not invent a catalogue entry or guess the class. Obtain a maintainer-confirmed compatible kit/catalogue revision or a supported official route.

## Engineering work present on the contribution branch

- Public-source register and category coverage matrix.
- SCVD metadata fetcher and deterministic 30-case pilot builder.
- Metadata-only review queue; it does not author prompts, answers, preference labels or reviewer attestations.
- Local preference-pair validator and Node regression tests.
- CI integration for validator execution when a non-empty dataset exists.
- SCVD review-queue workflow with 30-day artifact retention.
- Source-triage notes for AI Arena H-08, Beanstalk and Dropbox.
- Updated mission/protocol status documentation.

## SCVD snapshot and evidence limitations

The preserved 31 October 2026 artifact contains 1,064 source metadata records and a curated 30-case pilot (10 per category across 24 repositories). It is not a random or representative sample.

Observed pilot metadata coverage:
- source URL: 30/30
- source commit: 27/30
- source file: 11/30
- summary links: 9/30
- raw source references: 0/30
- contract name: 0/30
- function name: 0/30

The GitHub-hosted artifact expired on 14 November 2026. A local ZIP snapshot is preserved, SHA-256 `f44ac6d05dc2b5f668f6b7e2f338745bdeb7da2fb80a66f82b25cb79c187fee3`. A fresh run is triggered by a push touching the watched fetcher, pilot builder, CSV or workflow file; the workflow now requests 30-day retention.

All 30 cases remain `needs_independent_human_review`. No reviewer identity, review timestamp, chosen/rejected answer or human provenance has been created. The old artifact's metadata is not human verification.

Preliminary source triage only:
- AI Arena H-08: original Code4rena report and historical mitigation record located; exact callback path is a strong candidate for independent reproduction. This does not prove current deployment exploitability.
- Beanstalk: selected arithmetic-category summary describes a storage/gas optimization; taxonomy unresolved.
- Dropbox: selected reentrancy-category summary describes an informational import recommendation; taxonomy unresolved.

Every candidate still needs its original audit report, exact commit-pinned source file/function, preconditions, impact, reproducible evidence or precise source reasoning, and an independent second review. Unresolved records must be excluded.

## Dataset validation and provenance

- `pairs.jsonl` remains intentionally empty.
- CI runs `npm run test:audit-data` and runs `npm run validate:audit-data` when the dataset is non-empty. Empty data is reported as not submission-ready rather than treated as a successful dataset.
- Rejected-answer uniqueness now uses the same NFC/whitespace normalization as the other comparisons.
- The local validator always reports `readyForPoolSubmission: false`: local checks cannot authenticate reviewer identity, prove an independent second review, or establish Anjoman/network eligibility.
- The official adapter-kit data checks and Anjoman's per-row eligible/rejected status remain separate required gates. Do not equate a local pass or metadata URL with human verification.

## Current verification status

- Previous PR-head CI #630 and Phase 04 #327 passed on commit `47ca616`.
- Latest test-fix commit: `1472034116c9b7c283a0aa59567397eaaf3ce891` (corrected normalized-duplicate test expectation); validator syntax repair is `44643905f94455720fc2290cf010a3c9596b4853`. The branch compare reports 64 commits ahead of `main`, 0 behind; PR metadata reports 60 commits in the PR.
- The following remediation commits have now been pushed to the contribution branch:
  - validator normalization and fail-closed pool-readiness reporting;
  - regression test for normalized rejected-answer duplicates;
  - CI invocation of the actual validator when pairs exist;
  - SCVD artifact retention increased to 30 days.
- CI #633 and #634 failed on intermediate edits. CI #637 exposed an incorrect expected duplicate-share value; the test was corrected in `1472034`. On the reconciled PR head `fc200325566ae287bdaf5d7adeb97313be85d000`, CI #640 passed and Phase 04 #337 passed. The SMART_CONTRACT_AUDIT unit tests passed, including the new normalization regression. The dataset-validation CI step completed successfully by explicitly reporting that the dataset is empty and not submission-ready; the real data validator will execute when pairs.jsonl is populated. Do not interpret this as a populated-dataset validation.
- The SCVD workflow file now requests 30-day artifact retention. A fresh artifact has not yet been confirmed. Use a GitHub web UI commit touching the workflow file to verify the push-triggered SCVD workflow; a connector-authored contents update has not yielded a confirmed SCVD run.
- No adapter has been trained, exported, packaged, hosted, or registered. No live scorer endpoint has been confirmed.

## Authorization boundaries

- No preference labels, reviewer identity or human provenance may be fabricated.
- No evaluation data is uploaded to Anjoman/Telegraph by this work.
- No wallet message is signed; no bond, registration, adapter deployment, bounty claim or payment is performed.
- PR #256 remains Draft and is not merged.

## End-to-end execution framework

- Added [`EXECUTION_FRAMEWORK.md`](EXECUTION_FRAMEWORK.md), defining the full evaluator goal, official-vs-project requirements, P0 live-route gate, evidence and dual-review protocol, dataset quality gates, conditional adapter path, acceptance tests, submission evidence and priority schedule through the 1 December 2026 deadline.
- Reconciled the current Season II catalogue: `SMART_CONTRACT_AUDIT` is listed as Hybrid, correcting the older #128 Judgment / `_GENERAL` assumption. Live node canonical status, active miners, request schema and scorer resolution remain unverified.
- Framework does not mark any blocked work complete. Live Intent/scorer compatibility, human review, official data eligibility, adapter work (if required), and final submission remain open.


## 16 November implementation update

- Corrected the target identifier from historical `SMART_CONTRACT_AUDIT_GENERAL` to current catalogue Intent `SMART_CONTRACT_AUDIT` (Hybrid).
- Reworked the local validator to understand Hybrid question rows (`preference_pair`, `ground_truth`, `graded_exemplar`) and the separate `truth_source` row shape. It still always reports `readyForPoolSubmission: false`.
- Updated the SCVD candidate fetcher and pilot manifest to use the current canonical Intent ID.
- Added `scripts/verify-smart-contract-audit-live.mjs`, `npm run verify:audit-live`, unit tests, and `.github/workflows/smart-contract-audit-live.yml` to capture live Intent, miners, scorer resolution and pool status without any wallet action.
- Updated README and protocol requirements to match the current official Hybrid classification and evaluation-pool rules.
- Current adapter-kit HEAD still does not include `SMART_CONTRACT_AUDIT` in its compiled Hybrid catalogue; do not train/export until maintainers confirm a supported kit/catalogue path.
- The new workflow has not yet been verified on its post-change commit. All 30 pilot cases remain unreviewed, `pairs.jsonl` remains empty, and no official truth source has been uploaded.


## Live protocol evidence — 16 November 2026

GitHub Actions read-only evidence run: [43814704469](https://github.com/pawansatoshi/Veridex/actions/runs/43814704469).

- Registry: `SMART_CONTRACT_AUDIT_GENERAL` is canonical; `miner_count=18`.
- Child miner endpoint returns 18; family-prefix miner endpoint returns 0.
- Child detail: `class=judgment`, `request=null`, `response=null`.
- Family and child scorer resolution: `class=judgment`, `served_by=GENERIC`, `generic_fallback=true`, `routed=true`. This is a generic fallback, not a dedicated family module.
- Child evaluation pool: 302 eligible, 11 admitted, 71 quarantine, 2 rejected; 3 total submitters, 2 eligible submitters, minimum 5. Family-prefix pool is empty. These rows are existing third-party rows, not Veridex uploads.
- Question pool is below the five-eligible-contributor threshold. Three additional independent eligible contributors are needed.
- No request/response schema exists in the returned Intent detail, so a conforming truth-source YAML cannot yet be built.

## 16 November implementation update

- Corrected local evaluation-pool target to canonical child `SMART_CONTRACT_AUDIT_GENERAL`; family prefix remains `SMART_CONTRACT_AUDIT`.
- Reworked validator for official question row types and truth-source shape; it always reports `readyForPoolSubmission: false`.
- Added read-only live evidence script and Actions workflow. Its first run passed all 14 unit tests and captured the live registry, miners, scorer resolution and pool state.
- The published Hybrid classification vs live Judgment generic fallback remains unresolved; adapter-kit catalogue lacks both target names. No adapter build or truth-source upload is safe until maintainers confirm the route.
- All 30 SCVD cases remain unreviewed; `pairs.jsonl` remains empty; no Veridex row has been uploaded.


## Collaboration and submission preparation

- Opened Veridex issue [#257 — independent reviewers needed](https://github.com/pawansatoshi/Veridex/issues/257) to recruit genuine independent reviewers and eligible contributors.
- Opened Veridex issue [#258 — catalogue/live scorer/adapter-kit blocker](https://github.com/pawansatoshi/Veridex/issues/258) to track maintainer clarification.
- Added `SUBMISSION_DRAFT.md`, `CONTRIBUTOR_ONBOARDING.md`, `MAINTAINER_CLARIFICATION.md` and `PUBLIC_UPDATES_DRAFT.md`.
- The H2 website is open for registration and final submissions; this repository's final entry has not been registered or submitted. Official requirements include a valid evaluator contribution, reproducibility, a 2–5 minute demo or equivalent, public summary, evidence, GitHub username that starred the Bounties repository, and showcase permissions.
- The Bounties repository star is a mandatory entry item. The connected GitHub integration does not expose a star action; account holder must perform it.
- No X/LinkedIn/YouTube progress updates have been published by this automation. The three separate-date update requirement remains open.


## Latest CI reconciliation — 16 November 2026

- CI passed on code commit `ae31aed8fc56a2c2364e548d6624b094963d914a`: [run 43815193229](https://github.com/pawansatoshi/Veridex/actions/runs/43815193229).
- The evaluator test suite passed **14/14**; the dataset gate explicitly reported `not_run_empty_dataset` and `submission_ready: false`.
- Live evidence workflow passed on the latest PR head `3da298c0e24ba7d53eb9da7b5d7f64ecd4c1e6c4`: [run 43815216437](https://github.com/pawansatoshi/Veridex/actions/runs/43815216437).
- These results verify tests and read-only diagnostics. They do not establish eligible Veridex rows, a dedicated scorer, adapter registration, or final hackathon acceptance.
