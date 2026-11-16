# SMART_CONTRACT_AUDIT evaluator — Veridex contribution

This workspace began as a scaffold for Telegraph bounty [#128](https://github.com/telegraphprotocol/bounties/issues/128). That issue is now closed with reason `not_planned`; the maintainer redirected continuing work to Season II missions [#189 Exchange](https://github.com/telegraphprotocol/bounties/issues/189) and [#202 Web3 Native & DeFi](https://github.com/telegraphprotocol/bounties/issues/202). Mission #202 explicitly includes an Evaluators contribution route for SMART_CONTRACT_AUDIT.

## Scope and protocol facts

- Target Intent: `SMART_CONTRACT_AUDIT_GENERAL`.
- Registration family: `SMART_CONTRACT_AUDIT`.
- The issue and published catalogue describe the target as judgment. Live node class, canonical Intent and scorer routing must still be verified independently.
- Current adapter format: safetensors LoRA delta for the shared ModernBERT Foundation Model (`abi=lora-v1`, `format_version=1`). Full-model WASM is legacy.
- Pinned adapter-kit: `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`. Its compiled catalogue lacks `SMART_CONTRACT_AUDIT`; offline `ResolveClass` rejects the target. Do not invent a catalogue entry or guess a class. Obtain a maintainer-confirmed compatible revision or official extension path before training/export/package.

## What this repository currently provides

- Public SCVD metadata fetcher and curated 30-case pilot builder.
- Metadata-only human review queue; no prompts, answers, preference labels or human-review claims are generated.
- Fail-closed preference-pair validator and regression tests.
- CI runs the validator when `pairs.jsonl` is non-empty; an empty file remains explicitly not submission-ready.
- SCVD workflow stores artifacts for 30 days.
- Preliminary source-triage notes with original-report/source links where located.

## Evidence limitations

The preserved 31 October 2026 snapshot contains 1,064 metadata records and a curated 30-case pilot (10 per category across 24 repositories). It is not statistically representative. Coverage: source URL 30/30, source commit 27/30, source file 11/30, summary links 9/30, raw references 0/30, contract/function names 0/30.

All 30 pilot rows remain `needs_independent_human_review`. `pairs.jsonl` is empty. AI Arena H-08 is a historically reported and mitigated reentrancy candidate; Beanstalk and Dropbox have unresolved taxonomy mismatches. No item is a completed independent adjudication.

Every candidate needs the original audit report, exact commit-pinned source/function, preconditions, impact, reproducible evidence or precise source reasoning, and a second independent review. Exclude unresolved cases.

## Data quality

The local validator checks basic schema, duplicate prompts/rejected answers, length heuristics and declared provenance. It cannot authenticate reviewer identity, prove an independent second review or determine Anjoman/network eligibility. It always reports `readyForPoolSubmission: false`. The official adapter-kit checks and final Anjoman `eligible` status are separate gates.

Do not treat a source URL, automated metadata, a local validator pass or model-generated answer as human verification.

## Participation, reward and authorization

Issue #128 is labelled `reward:unfunded`; it promises no standalone GitHub payout. Season II prizes and protocol earnings are separate and eligibility-dependent. The user's account has not claimed #128, #189 or #202 in the comments checked for this update. Claiming is optional; if the user chooses to claim a mission, the bot requires meaningful `/progress <update>` at least every 72 hours.

No preference data is uploaded, no wallet message is signed, no bond or payment is made, no adapter is registered or deployed, and no bounty is claimed by this scaffold. PR #256 remains Draft and is not merged.
