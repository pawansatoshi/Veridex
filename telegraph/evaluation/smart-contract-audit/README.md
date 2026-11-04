# SMART_CONTRACT_AUDIT — Telegraph bounty #128

This workspace is a contribution scaffold for the public Telegraph issue:
https://github.com/telegraphprotocol/bounties/issues/128

## Scope

Target Intent: SMART_CONTRACT_AUDIT_GENERAL  
Registration family: SMART_CONTRACT_AUDIT  
Intent class: UNRESOLVED. The pinned adapter-kit does not classify SMART_CONTRACT_AUDIT in its compiled catalogue, so offline adapterbuild class resolution refuses the _GENERAL target. The official Intents guide says _GENERAL children belong to judgment prefixes; this suggests judgment, but only the live on-chain prefix kind is authoritative.

The bounty asks for two independently verifiable deliverables:

1. Public evaluation material: technically correct, distinct preference pairs with traceable public provenance and contributor attribution.
2. A current evaluator adapter for the SMART_CONTRACT_AUDIT family, accepted by the node and live after competition.

## Critical current-format rule

The original 28 October adapter-kit pin described a full-model float .wasm with abi_version 2 and runtime onnx_f32. That format is now obsolete and rejected by current validators as legacy_full_model. Q32.32 and MiniLM rank_answer formats are retired too.

The current adapter is a safetensors LoRA delta (format_version 1, abi lora-v1) applied to the validators' shared ModernBERT Foundation Model. The model and engine are not embedded in the package. The current adapter kit is pinned in baseline.lock; the current official requirements are recorded in TELEGRAPH-REQUIREMENTS-2026-11-01.md. Do not use the previous hybrid assumption: the current pinned kit cannot resolve this family offline, and the live node kind has not yet been verified.

Current public build sequence:

1. Prepare independently reviewed pairs.jsonl.
2. Train with float_runtime.train_adapter.
3. Export the LoRA delta with float_runtime.export_adapter against the published foundation.json.
4. Check/package with cmd/adapterbuild lora.
5. Host the exact safetensors package and run cmd/adapterexec behind a public HTTPS runnable endpoint.
6. Register with the required wasmRunnableUrl only after explicit user approval; current docs specify a $5 MACHINA bond plus gas.
7. Wait for remote check, package validation, bit-for-bit confirmation and hidden-pool competition.

A local training or package pass is not node acceptance. A candidate must reach at least 70% and beat the incumbent by at least two percentage points on the same hidden sample. The public pool must have at least five distinct contributors before questions are used.

## Veridex fit and limits

Veridex has deterministic evidence for ownership/control, proxy and upgradeability surfaces, pause controls, and mint authority. Those signals can provide audit context, especially for access-control analysis.

They do not establish detection of reentrancy or integer-overflow vulnerabilities. Do not label a capability observation as a confirmed vulnerability. The evaluator must distinguish confirmed findings from heuristics, exploitability from function presence, implementation behavior from proxy context, missing evidence from a clean bill of health, and severity from exploitability and confidence.

## Intent-class compatibility blocker — checked 4 November 2026

The pinned adapter-kit's `pkg/adapterbuild/class.go` resolves a `_GENERAL` intent by stripping the suffix and looking up its base prefix in the compiled catalogue. `SMART_CONTRACT_AUDIT` is absent from that catalogue, so `ResolveClass` rejects the target as unknown. The official Intents guide says `_GENERAL` children are used for judgment prefixes and deterministic/hybrid prefixes do not have `_GENERAL` children. This contradicts the previous `hybrid` assumption and points toward judgment, but the live on-chain `intentKind` and `/api/wasm?resolve=SMART_CONTRACT_AUDIT` remain authoritative and were inaccessible from this environment. Do not train/export/package until the live kind is verified and the official kit can resolve the target.

References: https://github.com/telegraphprotocol/telegraph-wasm-baseline/blob/1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd/pkg/adapterbuild/class.go ; https://github.com/telegraphprotocol/telegraph-wasm-baseline/blob/1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd/pkg/scoring/catalog/catalog.go ; https://anjoman.ai/docs/using/intents

## Current evidence state

- SCVD metadata queue: 1,064 records (55 reentrancy, 417 access_control, 592 arithmetic).
- Curated pilot: 30 records, 10 per category, across 24 source repositories. It is not a random or representative sample.
- Latest artifact metadata coverage: source URL 30/30, source commit 27/30, source file 11/30, summary links 9/30, raw references 0/30, contract name 0/30, function name 0/30.
- All 30 pilot rows remain needs_independent_human_review. Reviewer, timestamp, prompt, chosen, rejected and human provenance fields are blank.
- pairs.jsonl is intentionally empty.
- Preliminary source spot checks found a callback path consistent with the AI Arena reentrancy report, a Beanstalk gas/storage optimization misclassified under arithmetic, and a Dropbox informational import recommendation misclassified under reentrancy. None is a final human adjudication.

Before any preference pair is created, independently locate the original audit report, resolve the exact source file/function at the pinned commit, assess preconditions and impact, record reproducible evidence or precise source reasoning, and obtain a second independent review. Exclude unresolved cases.

## Data quality and provenance

The official kit's current checks include unique rejected answers (at least 80%), no single rejected answer above 2%, identical chosen/rejected no more than 1%, length-only heuristic accuracy at most 65%, held-out leakage at most 10%, and surface-style heuristic accuracy at most 65%.

A public URL alone does not attest a generated or model-authored answer. Do not mark provenance as human unless a human reviewer actually authored and verified the preference judgment. Each evaluation-pool upload is signed by its contributor and must be checked for final eligible status.

## Reward and participation

Issue #128 is labelled reward:unfunded and does not promise bounty payment. Posting /claim is optional and is required only if a contributor wants to be listed as a participant. After claiming, the issue requires /progress <what you did> at least every 72 hours or the claim lapses.

No /claim or /progress comment has been posted for pawansatoshi as of 4 November 2026.

## Security and authorization

Never commit private keys or unpublished evaluation material. No data upload, signature, wallet approval, bond, registration, adapter deployment, bounty submission or payment is performed by this scaffold. PR #256 remains Draft until the user explicitly chooses otherwise.
