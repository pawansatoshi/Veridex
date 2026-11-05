# Telegraph source-document divergence — 5 November 2026

## Why this note exists

The public bounty issue and the official adapter guides currently describe different evaluator packaging workflows. Do not train, export, publish, or register an adapter until the maintainer confirms which acceptance contract governs issue #128 and the live node class is resolved.

## Evidence from the public sources

### Bounty issue #128 (last updated 29 October 2026)

The issue body still describes:
- an adapter packed into one `.wasm` file;
- training and packaging to produce `<INTENT>.wasm`;
- registration of that file.

It also says the issue is **Unfunded** and requires:
- accepted evaluation material for the target Intent;
- a live evaluator adapter on the `SMART_CONTRACT_AUDIT` family;
- a `/claim` comment to be listed as a participant;
- `/progress <what you did>` at least every 72 hours after claiming.

Source: https://github.com/telegraphprotocol/bounties/issues/128

### Current shared-foundation documentation

The current Build an Evaluator Adapter guide and Shared Foundation upgrade guide describe a different format:
- safetensors LoRA delta package;
- `abi=lora-v1`, `format_version=1`;
- shared ModernBERT Foundation Model and reward head;
- full-model float `.wasm` packages rejected as `legacy_full_model`.

Sources:
- https://anjoman.ai/docs/scoring/build-a-scoring-module
- https://anjoman.ai/docs/scoring/upgrade-shared-foundation

### Conflicting training guide

The Train an Evaluator Adapter page still describes the older full-model workflow that exports ONNX, bakes a model and engine into a WASM file, and packages `<INTENT>.wasm`.

Source: https://anjoman.ai/docs/scoring/train-a-scoring-adapter

This is a material inconsistency across official documentation, not merely a difference in terminology. The newer Build and Shared Foundation pages describe the delta format, while the issue and training page still describe the older WASM artifact. Request maintainer clarification before treating either description as the issue's final acceptance test.

## Intent class and adapter-kit compatibility

Target Intent: `SMART_CONTRACT_AUDIT_GENERAL`  
Registration family: `SMART_CONTRACT_AUDIT`

The official Intents guide states:
- the on-chain prefix kind is authoritative (1 deterministic, 2 hybrid, 3 judgment);
- an intent takes the kind of its longest matching prefix;
- judgment prefixes ship with `_GENERAL` children, while deterministic and hybrid prefixes do not;
- the live node can return the canonical intent details and the scorer resolution.

Source: https://anjoman.ai/docs/using/intents

The pinned adapter-kit at `1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd`:
- strips the `_GENERAL` suffix when looking up the compiled class;
- refuses to guess if the prefix is absent from the compiled catalogue;
- does not currently include `SMART_CONTRACT_AUDIT` in its compiled judgment/hybrid map.

Therefore the offline builder cannot currently resolve this target from its compiled catalogue. The `_GENERAL` convention suggests judgment, but this is not a substitute for the live on-chain class and node routing.

Live reads still required:
1. `GET https://devnode.telegraphprotocol.com/engine/v1/intents/SMART_CONTRACT_AUDIT_GENERAL` — inspect `class`, `served_by`, `canonical`, and `miner_count`.
2. `GET https://devnode.telegraphprotocol.com/api/wasm?resolve=SMART_CONTRACT_AUDIT` — inspect `served_by`, `scorer`, `inherited`, and `routed`.
3. If the HTTP endpoints are unavailable, query the official Sepolia Diamond for `getPrefixes()` and `intentKind("SMART_CONTRACT_AUDIT_GENERAL")`, and record the block number and RPC used.

The endpoints were inaccessible from the automation environment on 5 November 2026. No class is asserted in this note.

## Current work status

- PR #256 remains Draft.
- Latest branch head at this review: `d801c52f24c9ccba34e74258caca260cb345dfc9`.
- CI #629 and Phase 04 #326 passed on that head.
- The latest SCVD review-queue artifact is still workflow #5 from 31 October; documentation-only commits did not trigger a new artifact run.
- The 30-case queue is metadata-only. All cases remain pending independent human review; `pairs.jsonl` is empty.
- No `/claim`, `/progress`, `/submit`, evaluation-pool upload, wallet signature, bond, adapter deployment, or registration has occurred.

## Gate to resume adapter implementation

1. Obtain the two live node responses (or an on-chain class proof with block number).
2. Ask the issue maintainer to reconcile the issue's WASM wording with the current shared-foundation safetensors delta workflow and identify the required artifact for acceptance.
3. Update the pinned adapter-kit/catalogue or use a maintainer-confirmed compatible revision that resolves this Intent without a guessed class.
4. Only then implement the training/export/package workflow.

No adapter class, acceptance format, preference label, or human provenance should be fabricated to bypass these gates.
