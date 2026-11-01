# Telegraph evaluator requirements — verified 1 November 2026

This note records the current public requirements checked against the official Anjoman/Telegraph documentation and the public adapter-kit repository. It supersedes the full-model WASI adapter description that was pinned in this workspace on 28 October.

## Critical format change

The old full-model float .wasm format (abi_version 2, runtime onnx_f32, class hybrid) is no longer accepted for evaluator adapters. The node rejects it as legacy_full_model. Q32.32 packages and the old MiniLM rank_answer module are also retired.

The current evaluator-adapter format is a **safetensors LoRA delta** for the validators' shared ModernBERT Foundation Model:

- format_version="1", abi="lora-v1"
- class="hybrid" for this target, subject to checking the live intent catalogue again before export/registration
- intent is the registered family prefix
- foundation and tokenizer hashes must match the published release
- LoRA rank 1–16; F32 tensors; target modules Wqkv, Wo, Wi; max tokens 1–512
- the model weights and engine are not embedded in the package; validators load the shared Foundation Model

Current official training/export/package path:

1. python -m float_runtime.train_adapter --intent SMART_CONTRACT_AUDIT --data pairs.jsonl --out runs/SMART_CONTRACT_AUDIT
2. python -m float_runtime.export_adapter --run runs/SMART_CONTRACT_AUDIT --intent SMART_CONTRACT_AUDIT --class hybrid --foundation foundation/foundation.json
3. go run ./cmd/adapterbuild lora --intent SMART_CONTRACT_AUDIT --package runs/SMART_CONTRACT_AUDIT/SMART_CONTRACT_AUDIT.safetensors --foundation foundation/foundation.json

Use the current released foundation.json, tokenizer, Foundation Model and engine; do not locally regenerate the Foundation Model and assume its hash will match validators.

## Runnable endpoint and registration

Evaluator adapters require a real wasmRunnableUrl in addition to the hosted package URL. The endpoint must run the exact package on the same Foundation Model and engine, accept the node's batch request, echo the foundation/adapter/tokenizer identity, and return exact F32 score bits. The reference executor is cmd/adapterexec. The current guide says to keep the endpoint publicly reachable over HTTPS, avoid redirects/private or loopback addresses, and provide at least 5 GB RAM.

The current registration signature is:

registerWasm(bytes32 wasmHash, string wasmUrl, string intent, address feeAddress, string wasmRunnableUrl)

Current public docs specify a **$5 MACHINA adapter bond plus gas**. The bond is returned on deregistration. Registration, signing, approval, endpoint publication and any upload remain explicit user-authorized actions; none is performed by this contribution scaffold.

The node sequence is: runnable-endpoint public-pair check (at least 70% correctly ordered), package download/hash, Stage 1 package validation, bit-for-bit confirmation against the endpoint, then hidden-pool competition. To replace an incumbent the candidate needs at least 70% overall and at least a 2 percentage-point win over the incumbent on the same sample. A family child with at least 10 scored pairs has a 60% floor.

## Evaluation data requirements

- One JSONL row per question, with prompt, chosen, rejected, and label_kind="preference_pair" where appropriate.
- For hybrid intents, chosen and rejected should be complete miner responses to the same question.
- Current kit data checks include unique rejected answers (at least 80%), no single rejected answer over 2%, identical chosen/rejected no more than 1%, length-only heuristic accuracy at most 65%, held-out leakage at most 10%, and surface-style heuristic accuracy at most 65%.
- Each upload is signed by its contributor. An HTTP(S) source URL alone does not turn generated or model-authored content into human provenance.
- Questions are not used for ranking/competition until the pool has at least five distinct contributors.
- Rows must be checked for their final eligible state after submission; a local validator pass is not node acceptance.

## Current Veridex evidence state

- SCVD source queue: 1,064 metadata records (55 reentrancy, 417 access control, 592 arithmetic).
- Curated pilot: 30 records (10 per category, 24 source repositories); this is not a random or representative sample.
- Latest pilot artifact coverage: source URL 30/30, source commit 27/30, source file 11/30, summary links 9/30, raw source references 0/30, contract name 0/30, function name 0/30.
- All 30 pilot rows remain needs_independent_human_review; reviewer, timestamp, prompt, chosen, rejected and human-provenance fields are blank.
- pairs.jsonl remains empty. No preference pairs have been authored or uploaded.
- Three source-level spot checks are preliminary only: AI Arena's callback path is consistent with the reported reentrancy mechanism; the Beanstalk item describes a gas/storage optimization despite its arithmetic taxonomy; the Dropbox item is an informational import-style recommendation despite its reentrancy taxonomy. These are not final valid/invalid adjudications.
- Before any preference pair is created, each case needs the original audit-report permalink, exact source file/function at the pinned commit, exploitability/impact analysis, reproducible evidence or precise reasoning, and an independent second review.

## Bounty participation

Issue #128 is labelled reward:unfunded: it does not promise bounty payment. Posting /claim is optional and is required only if a contributor wants to be listed as a participant. After claiming, the issue requires /progress <what you did> at least every 72 hours. No claim or progress comment has been posted for pawansatoshi as of this check.

## Sources checked

- https://github.com/telegraphprotocol/telegraph-wasm-baseline/commit/1ed063e2f0066cfaf0e124d66ec6a17b7a6121fd
- https://github.com/telegraphprotocol/telegraph-foundation/releases/tag/modernbert-base-lora16-v1
- https://anjoman.ai/docs/scoring/train-a-scoring-adapter
- https://anjoman.ai/docs/scoring/build-a-scoring-module
- https://anjoman.ai/docs/scoring/contribute-evaluation-data
- https://github.com/telegraphprotocol/bounties/issues/128
