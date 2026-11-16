# SMART_CONTRACT_AUDIT evaluator — implementation status
**Last reconciled: 16 November 2026, 10:29 IST**

## Current scope and official destination

- Target Intent: `SMART_CONTRACT_AUDIT_GENERAL`; registration family: `SMART_CONTRACT_AUDIT`.
- Telegraph bounty issue [#128](https://github.com/telegraphprotocol/bounties/issues/128) is **closed** with reason `not_planned` (15 November 2026). The maintainer says work continues inside the Season II missions it serves: [#189 Exchange](https://github.com/telegraphprotocol/bounties/issues/189) and [#202 Web3 Native & DeFi](https://github.com/telegraphprotocol/bounties/issues/202).
- Mission #202 explicitly includes an Evaluators contribution route for SMART_CONTRACT_AUDIT. Mission work is non-exclusive; GitHub claim/progress comments coordinate participation, while the official Anjoman submission path is separate.
- Issue #128 retains the `reward:unfunded` label and explicitly says there is no standalone GitHub payout. Season II prizes and protocol earnings are separate and eligibility-dependent.
- No `/claim` has been posted by `pawansatoshi` on #128, #189 or #202 as of this reconciliation. No claim/progress clock is active. Do not post one without the user's explicit decision.

## Current published evaluator requirements

- Issue #128 now describes `SMART_CONTRACT_AUDIT_GENERAL` as a judgment Intent and identifies `SMART_CONTRACT_AUDIT` as the registration family.
- Current adapter documentation specifies a safetensors LoRA delta for the shared ModernBERT Foundation Model (`abi=lora-v1`, `format_version=1`). Full-model WASM is a legacy format.
- Mission #202 says evaluator work must follow the selected Intent's actual node class, family and scoring path. It asks for sourced, balanced better/worse examples and a compatible adapter **where needed**; do not assume a new adapter is always required.
- The published catalogue/issue describe judgment, but live node class and scorer routing have not been independently retrieved in this environment. Treat published classification and live routing as separate facts.
- The pinned adapter-kit commit in `baseline.lock` is `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`. Its compiled catalogue does not include `SMART_CONTRACT_AUDIT`; offline `ResolveClass` refuses the unknown family. Do not invent a catalogue entry or guess the class. Obtain a maintainer-confirmed compatible kit/catalogue revision or a supported official route.

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
- CI runs #633 and #634 failed before the validator syntax repair. CI #637 then failed only because the new regression test expected a duplicate rejected-answer share of 0.5; the correct share for two identical normalized rows is 1.0. That assertion was corrected in commit `1472034`. Phase 04 #331 and #334 passed before the final test correction. A fresh CI run for the latest commit is not yet confirmed; do not describe the latest commit as CI-passing.
- The SCVD workflow file now requests 30-day artifact retention. A fresh artifact has not yet been confirmed; a UI-originated branch push is still needed to verify the push-triggered workflow.
- No adapter has been trained, exported, packaged, hosted, or registered. No live scorer endpoint has been confirmed.

## Authorization boundaries

- No preference labels, reviewer identity or human provenance may be fabricated.
- No evaluation data is uploaded to Anjoman/Telegraph by this work.
- No wallet message is signed; no bond, registration, adapter deployment, bounty claim or payment is performed.
- PR #256 remains Draft and is not merged.
