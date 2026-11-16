# Telegraph evaluator requirements — reconciled 16 November 2026

## Current work destination

Bounty issue [#128](https://github.com/telegraphprotocol/bounties/issues/128) is closed with reason `not_planned` as of 15 November 2026. The maintainer directed continuing work into [Mission #189 — Exchange](https://github.com/telegraphprotocol/bounties/issues/189) and [Mission #202 — Web3 Native & DeFi](https://github.com/telegraphprotocol/bounties/issues/202). Mission #202 explicitly includes SMART_CONTRACT_AUDIT in its Evaluators route.

Issue #128 remains labelled `reward:unfunded` and says there is no standalone GitHub payout. Season II prizes and protocol earnings are separate and subject to their own eligibility and verification.

## Intent and adapter

- Target: `SMART_CONTRACT_AUDIT_GENERAL`.
- Family: `SMART_CONTRACT_AUDIT`.
- The current issue body and published catalogue describe the Intent as judgment.
- Mission #202 requires using the selected Intent's actual live node class, family and scoring path. Do not infer live routing from a name or a stale description.
- Current evaluator adapter format: safetensors LoRA delta, `format_version=1`, `abi=lora-v1`, on the shared ModernBERT Foundation Model. Full-model float WASM is a legacy format.
- Pinned adapter-kit: `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`. The compiled catalogue at this pin lacks `SMART_CONTRACT_AUDIT`; offline class resolution rejects the family. Do not invent a catalogue entry or guess the class. Obtain live node evidence and a maintainer-confirmed compatible kit/catalogue revision before training or export.
- Evaluator adapter is required only where the live scoring path calls for one; mission guidance explicitly says not to assume every Intent needs a new adapter.

## Evaluation data quality

The official adapter-kit checks include:
- unique rejected answers at least 80%;
- no single rejected answer above 2%;
- identical chosen/rejected at most 1%;
- length-only shortcut accuracy at most 65%;
- held-out leakage at most 10%;
- surface-style shortcut accuracy at most 65%.

Use primary evidence, source URLs, pinned commits, chain/block or jurisdiction identifiers, units/tolerances, and balanced correct/incorrect/incomplete/ambiguous cases. A public URL does not prove human authorship or review. Local validation does not establish Anjoman eligibility; each row's final `eligible` / `rejected` state must be checked in the official interface.

The local Veridex validator now normalizes rejected-answer uniqueness consistently and reports pool readiness as false because it cannot authenticate independent human review or network eligibility. CI invokes the validator when the dataset is populated. The current `pairs.jsonl` is intentionally empty.

## Current SCVD pilot

The preserved 31 October 2026 metadata snapshot contains 1,064 candidates and a curated 30-case pilot (10 each for reentrancy, access control and arithmetic; 24 repositories). It is not random or representative. Metadata coverage: source URL 30/30, source commit 27/30, source file 11/30, summary links 9/30, raw references 0/30, contract/function names 0/30.

All 30 records remain `needs_independent_human_review`. The GitHub artifact expired 14 November 2026; a local archive is preserved with SHA-256 `f44ac6d05dc2b5f668f6b7e2f338745bdeb7da2fb80a66f82b25cb79c187fee3`. The review-queue workflow now requests 30-day artifact retention and is configured to run on a push touching its workflow file.

## Source-review notes

- AI Arena H-08: original Code4rena report and historical mitigation record located; source callback path is a candidate for independent reproduction. It does not prove current deployment exploitability.
- Beanstalk: selected arithmetic-category item describes a gas/storage optimization; taxonomy unresolved.
- Dropbox: selected reentrancy-category item describes an informational import recommendation; taxonomy unresolved.

No candidate is human-adjudicated. Obtain original reports, exact pinned source, exploitability/impact reasoning and independent second review before writing preference pairs.

## Participation

No `/claim` by `pawansatoshi` was found on #128, #189 or #202 in the comments checked on 16 November. If the user chooses to claim a current mission, the bot requires a meaningful `/progress <update>` at least every 72 hours. Do not claim on the user's behalf.

## Authorization

No data upload, signature, wallet approval, bond, adapter registration/deployment, bounty submission or payment is performed here. PR #256 remains Draft and is not merged.
