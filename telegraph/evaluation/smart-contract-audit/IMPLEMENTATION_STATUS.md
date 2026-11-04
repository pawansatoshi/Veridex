# Implementation status — 1 November 2026

## Confirmed current requirements

- Telegraph bounty issue #128 is open, tagged work:evaluator, priority:p2 and reward:unfunded.
- Target Intent: SMART_CONTRACT_AUDIT_GENERAL. Registration family: SMART_CONTRACT_AUDIT. **Class is unresolved and must not be assumed hybrid.** The pinned adapter-kit's compiledClassOf strips _GENERAL and looks up the base prefix, but SMART_CONTRACT_AUDIT is absent from its compiled judgmentOrHybrid catalogue; ResolveClass therefore refuses the target as unknown. The official Intents guide says _GENERAL children are the convention for judgment prefixes and deterministic/hybrid prefixes have no _GENERAL child, which points toward judgment but is not a substitute for the live on-chain intentKind. The live node endpoint could not be reached from this environment on 4 November. Do not export or register until the live prefix kind and node routing are confirmed.
- The official adapter format changed after the original 28 October pin. Full-model float .wasm packages (abi_version 2 / runtime onnx_f32) are no longer accepted and are rejected as legacy_full_model. Q32.32 and MiniLM rank_answer formats are also retired.
- Current evaluator adapters are safetensors LoRA deltas for the shared ModernBERT Foundation Model (abi lora-v1, format_version 1). The base model and engine are not embedded in the adapter package.
- Current official adapter kit pin: telegraph-wasm-baseline commit 1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd (signed commit, 31 October 2026). Foundation release: modernbert-base-lora16-v1.
- Current training requires Python 3.10+, Go 1.25+ for package checking, and a GPU is strongly recommended. The executor needs the published Foundation Model and engine. The current registration requires a real wasmRunnableUrl and a $5 MACHINA bond plus gas.
- The current node flow includes runnable-endpoint public-pair checking, package hash and Stage 1 validation, bit-for-bit endpoint confirmation, and hidden-pool competition. A challenger needs at least 70% and at least a 2-point improvement over the incumbent on the same sample; the pool needs at least five distinct contributors.

## Work completed on this branch

- Added a public-source register and coverage matrix for reentrancy, access control, arithmetic, and negative controls.
- Added a fail-closed local dataset validator and tests for schema, duplicates, length bias, provenance, and source requirements.
- Added an SCVD metadata fetcher. It creates a review queue only; it does not fabricate prompts, answers, or preference labels.
- Added a deterministic curated 30-case pilot builder and tests.
- Added a GitHub Actions workflow that fetches public SCVD metadata, builds the pilot packet, prints field coverage, and uploads the artifact.
- Preserved source references and extracted inline links from SCVD finding summaries.
- Added preliminary source-level spot-check notes. They are explicitly not final human adjudications.
- Updated baseline.lock to the current shared-foundation adapter kit and added TELEGRAPH-REQUIREMENTS-2026-11-01.md documenting the current public protocol requirements.

## Latest verified CI and artifacts

- PR head at last check: 0b69418babd643269f2ba45d6fe75f675f8b76db (4 November 2026 check; no newer branch commit found).
- CI run #626: success (test job).
- Phase 04 Continuous Watch #323: success (phase4 job).
- Pilot workflow #5: success, all seven substantive steps completed; the artifact remains from 31 October and has not been regenerated after the later documentation commits.
- Pilot workflow artifact: smart-contract-audit-human-review-queue, 258,736 bytes, generated 31 October 2026 17:15:43 UTC, expires 14 November 2026 17:15:43 UTC.
- Artifact source queue: 1,064 records (55 reentrancy, 417 access_control, 592 arithmetic).
- Pilot: 30 records, 10 per category, 24 distinct source repositories.

The artifact was generated at commit 68a5256, before the later documentation-only source spot-check commit. The workflow's fetch/build code and selection inputs were already present at that run. The latest PR head's CI passed after the subsequent commits.

## Evidence quality and human-review gate

Latest artifact metadata coverage:
- source URL: 30/30
- source commit: 27/30
- source file: 11/30
- source summary links: 9/30
- raw source references: 0/30
- contract name: 0/30
- function name: 0/30

All 30 pilot records remain needs_independent_human_review. Reviewer, timestamp, prompt, chosen, rejected and human provenance fields are blank. pairs.jsonl is intentionally empty.

Preliminary source-level spot checks:
- AI Arena: the claimRewards → mintFromMergingPool → _safeMint callback path is consistent with the reported reentrancy mechanism and should be independently reproduced.
- Beanstalk: the selected arithmetic-category item describes reducing repeated allowance storage operations; it is not an arithmetic vulnerability as stated.
- Dropbox: the selected reentrancy-category item is an informational named-import recommendation and does not describe a reentrancy exploit.

These observations are preliminary source triage only. No case is marked valid, invalid, or human-verified. Every selected case still needs the original audit report, exact source file/function at the pinned commit, exploitability and impact analysis, reproducible evidence or precise source reasoning, and an independent second review. Unresolved cases must be excluded.

## Current blockers

- The 30-case pilot is curated, not random or statistically representative.
- SCVD metadata and category labels are not ground truth.
- The pilot lacks complete exact source locations and original audit-report permalinks for most cases.
- No independently reviewed preference pairs exist.
- No row has been uploaded to the Telegraph evaluation pool or confirmed eligible.
- At least five distinct contributors are required before question material is used.
- No adapter has been trained, exported, packaged, hosted, or registered.
- The earlier 28 October full-model WASI adapter path is obsolete; the current safetensors shared-foundation path is documented, but it has not yet been implemented or executed in this environment.
- **New adapter-class blocker (4 November):** the pinned adapter-kit's offline ResolveClass for SMART_CONTRACT_AUDIT_GENERAL cannot resolve the target because the base prefix is absent from its compiled catalogue. The _GENERAL convention in the official Intents guide indicates judgment prefixes, while the workspace had incorrectly recorded hybrid. Live on-chain intentKind and /api/wasm?resolve=SMART_CONTRACT_AUDIT remain unverified because the devnode endpoint was inaccessible from this environment. Do not trust the old --class hybrid example until this is resolved.
- The current environment has Python 3.13.5 and Node 22, but Go 1.23.2 (below the required Go 1.25+) and no visible GPU. It has no Rust toolchain; the published foundation engine is available from the official release, so rebuilding it locally is not a prerequisite for the current adapter-author workflow.
- A runnable endpoint has not been deployed. The current guide requires the exact shared-foundation runtime, a public HTTPS batch endpoint and sufficient memory.

## Bounty participation status

No /claim or /progress comment has been posted by pawansatoshi on issue #128. /claim is optional and is required only if the user wants to be listed as a participant. Once claimed, /progress <what you did> must be posted at least every 72 hours or the claim lapses. The issue is explicitly reward:unfunded; it does not promise bounty payment.

## Actions deliberately not taken

- No preference labels or human provenance have been fabricated.
- No evaluation data has been signed or uploaded.
- No /claim or /progress comment has been posted.
- No wallet signature, bond approval, registration, adapter deployment, payment, or bounty submission has occurred.
- PR #256 remains Draft; no merge or readiness transition has been performed.

## Next milestone

First resolve the live SMART_CONTRACT_AUDIT prefix kind and adapter-kit compatibility; the offline builder currently rejects the target as unknown. In parallel, resolve the 30 candidates to original audit reports and exact commit-pinned source locations, then complete independent human adjudication. Only accepted cases should be used to author preference pairs. In parallel, coordinate additional independent contributors so the evaluation pool can reach five submitters. Once eligible public data exists, implement the current safetensors shared-foundation adapter workflow and its runnable endpoint, then seek explicit user approval before any signed upload or on-chain registration.
