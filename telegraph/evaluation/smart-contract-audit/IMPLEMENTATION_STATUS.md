# Implementation status — 30 October 2026

## Confirmed facts

- Bounty #128 is open, tagged `work:evaluator`, `priority:p2`, and `reward:unfunded`.
- The target intent is `SMART_CONTRACT_AUDIT_GENERAL`; the scoring family is `SMART_CONTRACT_AUDIT`.
- The current H2 catalogue identifies the family as Hybrid.
- The current adapter kit is V2 float-model format: ModernBERT-base reward model, FP32 ONNX, baked WASI command, `telegraph.adapter` ABI v2, runtime `onnx_f32`, class `hybrid`.
- The previous Track 2 `rank_answer` and Q32.32 model formats are retired and must not be reused.
- A challenger must clear structural checks, the public runnable-endpoint smoke test, and hidden-pool competition. Existing canonical adapter replacement requires >=70% win rate and >=2 percentage points over the incumbent. Family children also have a 60% floor when at least 10 pairs are scored.
- Evaluation-pool question material requires at least five distinct contributors before the pool can be used for the question ranking/competition flow.
- Generated/LLM/synthetic/model provenance is unverified even if a URL is attached.

## Changes on this branch

- Added a V2-specific contribution workspace and pinned the public adapter kit commit.
- Added source/license register and a coverage matrix for reentrancy, access control, arithmetic, and negative controls.
- Replaced the initial dataset validator so it no longer rejects generated rows as structurally invalid or falsely treats any URL as human attestation.
- Added an SCVD metadata fetcher that creates a human-review queue only; it does not fabricate prompts or answers.
- Added local tests for fail-closed behavior, duplicate prompt detection, and provenance classification.

## Verification and remaining blockers

Local syntax/tests are being run in this branch. The current execution environment has Python 3.13.5, Node 22, Go 1.23.2, no Rust toolchain and no visible GPU. The official adapter kit requires Go 1.25+, Rust with `wasm32-wasip1`, Python 3.10+, and preferably a GPU for practical ModernBERT training. The container also has no outbound DNS/network access, so it cannot fetch SCVD data or clone the adapter kit directly.

No preference dataset is being fabricated. The source queue must be fetched in a network-enabled environment and reviewed by humans. The final dataset must pass both this repository's preflight and the pinned kit's `train_adapter.py --check-data`.

No wallet signature, private key, upload, bond, registration, deployment, public bounty claim, or payment has been performed.
